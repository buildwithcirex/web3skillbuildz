# Security & RLS Policies

All database access is secured using Supabase Row Level Security (RLS).

## 1. Profiles Table Policies
Ensure RLS is enabled:
```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
```

**Participant Policy:** Users can only view and update their own record.
```sql
CREATE POLICY "Users can view own profile" 
ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE USING (auth.uid() = id);
```

**Admin Policy:** Admins have full CRUD access.
```sql
CREATE POLICY "Admins have full access" 
ON profiles FOR ALL USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);
```

## 2. Storage Policies (Bucket: `project_screenshots`)
Ensure RLS is enabled on the storage schema.

- **Upload:** Authenticated users can insert files.
- **View:** All authenticated users (or public, depending on strictness) can read files.
- **Delete:** Only admins can delete files.

```sql
CREATE POLICY "Authenticated users can upload" 
ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'project_screenshots');

CREATE POLICY "Admins can delete images" 
ON storage.objects FOR DELETE TO authenticated USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);
```