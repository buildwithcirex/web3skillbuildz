# AI Handoff & Project State Tracker

**ATTENTION AI ASSISTANT:** 
Whenever a new chat session begins, read this file first to understand the current state of the project. 
**CRITICAL INSTRUCTION:** You must proactively update this file at the end of every significant task or at the end of a session to ensure the next session can resume seamlessly. Maintain the checkboxes (`[x]` for done, `[ ]` for pending, `[-]` for in-progress).

---

## 📅 Project Status Overview
- **Current Phase:** Phase 8 — Authentication Overhaul & Pre-Registration Sync
- **Last Updated:** 2026-09-26T15:05:00+05:30
- **Current Blocker/Notes:** We completely removed the Registration flow and switched to Passwordless Magic Link (OTP) authentication. Only students with a college email (`ce*@kccemsr.edu.in`) who have pre-registered via a Google Form are allowed to log in. We built a Google Apps Script that syncs form responses to a new `allowed_emails` table in Supabase. A `BEFORE INSERT` Postgres trigger on `auth.users` blocks unauthorized signups. The admin dashboard had a "red error" related to a missing RPC (`admin_list_teams`), which the user resolved by manually applying the latest `team_system_schema.sql` in the Supabase SQL editor. Vercel deployment issues caused by corrupted `.next` cache and missing environment variables have also been addressed.

---

## ✅ Completed Tasks
*(Move items here once fully implemented and tested)*
- [x] Initial project documentation and architecture planning curated.
- [x] Read all `.md` specification files to understand the project scope.
- [x] Initialize Next.js App Router project with Tailwind CSS.
- [x] Install dependencies: `@supabase/supabase-js`, `@supabase/ssr`, `lucide-react`.
- [x] Configure environment variables (`.env.local` with placeholders — user needs to fill in real values).
- [x] Create `src/proxy.ts` — route protection and role-based redirection.
- [x] Create `src/app/auth/callback/route.ts` — Supabase auth callback route handler.
- [x] **[NEW]** Migrated login entirely to Passwordless Magic Links (OTP).
- [x] **[NEW]** Removed `RegisterForm.tsx` tab from the frontend.
- [x] **[NEW]** Added `signInWithMagicLink` server action in `src/app/actions/auth.ts`.
- [x] **[NEW]** Setup automated Google Form -> Supabase sync using Google Apps Script.
- [x] **[NEW]** Implemented database-level signup blocking (Postgres Trigger on `auth.users`) to enforce college email format and whitelist check against `allowed_emails` table.
- [x] Fixed ESLint `react-hooks/set-state-in-effect` issue in `useTeamNotifications.ts`.
- [x] Addressed Vercel deployment `500 Internal Server Error` (corrupted build cache & missing env vars).
- [x] Split dashboard into home page (`/dashboard`) and submission page (`/dashboard/submit`); extracted `DashboardNav` shared component.
- [x] Moved submission + scoring from `profiles` to `teams` (team-level, not individual).
- [x] Added team locking: `lock_team()` (leader self-lock), `unlock_team()` (admin), `set_team_formation_lock()` (admin global force-lock).
- [x] New public leaderboard: `src/app/dashboard/results/page.tsx` + `Podium.tsx` + `LeaderboardList.tsx`.
- [x] **Production build passes with zero errors; `npm test` passes.**

---

## 🚧 In Progress
*(Move the currently active task here)*
- [-] Verifying the end-to-end Magic Link login flow on the live deployed Vercel site.

---

## 📝 Pending Backlog (To-Do)

### Phase 8: Frontend Polish
- [ ] Ensure any text mentioning "Password" is removed across the app.
- [ ] Handle any Vercel environment variable updates (e.g. `NEXT_PUBLIC_SITE_URL` for correct Magic Link redirection in production).

### Phase 2: Database & Auth Setup (Supabase) — USER MUST DO MANUALLY
- [x] Run the full `files/team_system_schema.sql` in the Supabase SQL editor (Resolved the `admin_list_teams` cache error).
- [x] Setup the `allowed_emails` table and the `enforce_allowed_emails` trigger.
- [ ] Create the `project_screenshots` public storage bucket in Supabase dashboard.
- [ ] Apply RLS policies for the `profiles` table and storage bucket (see `files/security_protocols.md`).

### Phase 6: Final Polish
- [ ] Handle loading states and error handling across all forms.
- [ ] Final UI/UX polish with Tailwind CSS.

---

## 🧠 Context & Quirks
*(AI: Log any specific architectural decisions, workarounds, or bugs you encounter here so you don't forget them in the next session.)*
- **Role Assignment:** Remember, users NEVER choose their role. The database trigger handles it based on the hardcoded trigger logic. The admin email is explicitly whitelisted in the auth trigger (`ce25.rushabh.makwana@kccemsr.edu.in`).
- **Auth Strategy (Phase 8 Change):** No passwords! The app relies entirely on `supabase.auth.signInWithOtp()`. The frontend callback `auth/callback/route.ts` handles the session.
- **Whitelist Security:** The Google Apps Script bypasses RLS using the Supabase `service_role` key to populate `allowed_emails`. Signups are hard-blocked by a Postgres trigger on `auth.users` before insertion.
- **Data Fetching:** Use Server Components for initial fetching and Server Actions for mutations.
- **File Structure:** Uses `src/app` layout (not bare `app`). All components live in `src/app/`.
- **Supabase SSR:** Uses `@supabase/ssr` with `createServerClient` for server and `createBrowserClient` for client. Cookie handling is done in `src/lib/supabase/server.ts`.
- **Team writes are RPC-only:** `teams`/`team_members` have no direct INSERT/UPDATE/DELETE RLS policies on purpose. Every write, and every cross-user read, goes through a `SECURITY DEFINER` RPC.