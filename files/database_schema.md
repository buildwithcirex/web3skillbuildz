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
  project_description TEXT,
  deploy_link TEXT,
  screenshot_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 2. Storage Bucket
- **Name:** `project_screenshots`
- **Configuration:** Public bucket so images can be rendered easily on the admin dashboard.

## 3. Automated Admin Initialization Trigger
A Postgres function and trigger to auto-assign the admin role based on the environment variable, executing immediately upon user signup.

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
      WHEN NEW.email = current_setting('app.settings.admin_email', TRUE) THEN 'admin'
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