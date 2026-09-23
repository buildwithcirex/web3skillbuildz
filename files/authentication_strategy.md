# Authentication Flow

## 1. Provider
Authentication is handled entirely via **Supabase Auth** (Email & Password).

## 2. Registration Constraints
- The UI must only collect: Name, Email, Phone, Password.
- The signup payload passes `name` and `phone` via `options.data` (metadata).
- **Security:** There is no UI or payload parameter allowing a user to specify their role. Role assignment is strictly handled database-side via the Postgres trigger outlined in `DATABASE.md`.

## 3. Routing & Redirection
- **Middleware (`middleware.ts`):** Next.js middleware intercepts requests to `/dashboard` and `/admin`.
- It verifies the user's active session.
- If unauthenticated, it redirects to `/`.
- If authenticated, it checks the `role` from the `profiles` table.
- Admins attempting to access `/dashboard` are routed to `/admin`, and participants attempting to access `/admin` are routed to `/dashboard`.