# Database Schema & Configuration

## 1. Core Table: `profiles`
Because Supabase stores core auth data in the protected `auth.users` schema, a public `profiles` table is required.

```sql
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  role TEXT DEFAULT 'participant' CHECK (role IN ('participant', 'admin')),
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  project_description TEXT,
  deploy_link TEXT,
  screenshot_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 1a. Teams Table
Holds team definitions. Participants are assigned to a team via `profiles.team_id`.
The "create team" feature (built separately) populates this table and sets `team_id` on profiles.

```sql
CREATE TABLE public.teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

> **Note:** Create the `teams` table BEFORE adding `team_id` to `profiles` so the foreign key resolves.

## 2. Storage Bucket
- **Name:** `project_screenshots`
- **Configuration:** Public bucket so images can be rendered easily on the admin dashboard.

## 3. Automated Admin Initialization Trigger
A Postgres function and trigger to auto-assign the admin role, executing immediately upon user signup.

> **Supabase note:** `ALTER DATABASE` is blocked in the Supabase SQL editor. Hardcode the admin email directly in the trigger instead of using `current_setting()`.

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, phone, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'name',
    NEW.email,
    NEW.raw_user_meta_data->>'phone',
    CASE 
      WHEN NEW.email = 'your-admin@email.com' THEN 'admin'
      ELSE 'participant'
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

## 4. Team Building & Invitation System
Adds `teams`, `team_members`, `team_invitations`, and `notifications` tables, a
capacity-enforcing trigger, and `SECURITY DEFINER` RPC functions for every
read/write (since `profiles` RLS only allows reading your own row, all
cross-user team logic has to go through these functions rather than direct
table access). Full schema, RLS policies, and RPCs: see
[`team_system_schema.sql`](./team_system_schema.sql) — run it once in the
Supabase SQL editor after the schema above. `MAX_TEAM_SIZE` (3) and the
per-recipient invite cooldown (10s) are defined there and mirrored in
`src/lib/team/constants.ts`.