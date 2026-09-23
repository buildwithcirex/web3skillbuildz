# Deployment Guide

The optimal hosting environment for this Next.js application is Vercel, integrated with a GitHub or GitLab repository for continuous deployment.

## 1. Repository Setup
Push the completed local project to a new repository on GitHub or GitLab.

## 2. Vercel Configuration
1. Log in to Vercel and select **Add New Project**.
2. Import the Git repository containing the application.
3. In the project configuration, add the required Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_ADMIN_EMAIL`

## 3. Database Preparation
1. Access the Supabase dashboard.
2. Open the SQL Editor and execute the schemas, triggers, and RLS policies defined in `DATABASE.md` and `SECURITY.md`.
3. Create the public `project_screenshots` storage bucket.
4. Set the `app.settings.admin_email` variable in your Supabase database settings or configure the SQL trigger to match the production admin email.

## 4. Deployment
Click **Deploy** in Vercel. Upon completion, access the live URL, register with the designated admin email to initialize the first admin account, and verify dashboard access.