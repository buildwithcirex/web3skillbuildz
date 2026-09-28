-- Run this in your Supabase SQL Editor to ensure your account has the 'admin' role in the database.
-- Replace the email address below with your actual admin email if it is different.

UPDATE public.profiles
SET role = 'admin'
WHERE email = 'kcecell@kccemsr.edu.in';
