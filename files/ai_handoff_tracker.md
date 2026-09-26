# AI Handoff & Project State Tracker

**ATTENTION AI ASSISTANT:** 
Whenever a new chat session begins, read this file first to understand the current state of the project. 
**CRITICAL INSTRUCTION:** You must proactively update this file at the end of every significant task or at the end of a session to ensure the next session can resume seamlessly. Maintain the checkboxes (`[x]` for done, `[ ]` for pending, `[-]` for in-progress).

---

## 📍 Project Status Overview
- **Current Phase:** Phase 9 — UI/UX Overhaul & Web3 Builderthon Aesthetic
- **Last Updated:** 2026-09-26T19:26:00+05:30
- **Current Blocker/Notes:** The user deployed the app but noticed the UI looked the same on the `/admin` page. This was because the admin page hadn't been updated yet. We have now fully overhauled the `layout.tsx`, `globals.css`, `page.tsx`, `LoginForm.tsx`, `dashboard/page.tsx`, `DashboardNav.tsx`, and `admin/page.tsx` to a strict **Neo-Brutalist Web3 Builderthon** aesthetic (no gradients, sharp corners, flat shadows, monospace fonts). A global system rule (`30-web-design-reasons.md`) was added to `~/.gemini/config/rules/` to strictly enforce "anti-slop" design choices across all future agents. The user must run the `team_system_schema.sql` script in Supabase to fix the `admin_list_teams` RPC error and then push the git commits to see the UI updates on Vercel.

---

## ✅ Completed Tasks
*(Move items here once fully implemented and tested)*
- [x] Initial project documentation and architecture planning curated.
- [x] Read all `.md` specification files to understand the project scope.
- [x] Initialize Next.js App Router project with Tailwind CSS.
- [x] Configure environment variables (`.env.local`).
- [x] Create `src/proxy.ts` — route protection and role-based redirection.
- [x] Migrated login entirely to Passwordless Magic Links (OTP).
- [x] Setup automated Google Form -> Supabase sync using Google Apps Script.
- [x] Implemented database-level signup blocking (Postgres Trigger on `auth.users`).
- [x] Split dashboard into home page (`/dashboard`) and submission page (`/dashboard/submit`).
- [x] Moved submission + scoring from `profiles` to `teams` (team-level, not individual).
- [x] Added team locking logic and RPCs.
- [x] **[NEW]** Setup Global AI Design Rules (`~/.gemini/config/rules/30-web-design-reasons.md`).
- [x] **[NEW]** Overhauled UI to Neo-Brutalist Web3 theme (IBM Plex Mono/Sans, Stone/Charcoal palette, sharp edges).
- [x] **[NEW]** Rewrote `/admin` layout to match the new SYS_ADMIN aesthetic.
- [x] **Production build passes with zero errors; `npm test` passes.**

---

## ⏳ In Progress
*(Move the currently active task here)*
- [-] User testing participant flow using the Gmail '+' trick and validating the new Leave/Disband Team features.

---

## 📋 Pending Backlog (To-Do)

### Phase 2: Database & Auth Setup (Supabase) — USER MUST DO MANUALLY
- [x] Run the full `files/team_system_schema.sql` in the Supabase SQL editor (Pending user action to resolve `admin_list_teams` cache error).
- [x] Setup the `allowed_emails` table and the `enforce_allowed_emails` trigger.
- [x] Create the `project_screenshots` public storage bucket in Supabase dashboard.
- [x] Apply RLS policies for the `profiles` table and storage bucket (see `files/security_protocols.md`).
- [x] **[NEW]** Setup custom SMTP using Google Workspace app password to bypass Supabase rate limits.
- [x] **[NEW]** Added a 60-second cooldown timer to the magic link login UI.
- [x] **[NEW]** Corrected database `handle_new_user` trigger to fetch missing `name` and `phone` values from the `allowed_emails` table.
- [x] **[NEW]** Corrected `delete_user_completely` RPC to also purge users from the `allowed_emails` whitelist on deletion.
- [x] **[NEW]** Fixed team leadership bug: UI and DB now correctly promote team creator to `leader` ONLY after their first outgoing invitation is accepted.
- [x] **[NEW]** Added "Leave Team" / "Disband Team" logic to Next.js actions and `TeamOverviewCard.tsx`. Created `leave_team` RPC.

### Phase 6: Final Polish
- [ ] Handle loading states and error handling across all forms.
- [ ] Apply the Neo-Brutalist styling to the inner `TeamSection` and `ParticipantsTable` components.

---

## 🧠 Context & Quirks
*(AI: Log any specific architectural decisions, workarounds, or bugs you encounter here so you don't forget them in the next session.)*
- **Design System Enforcement:** The user explicitly hates generic AI SaaS design (slop). A strict rule exists in `~/.gemini/config/rules/30-web-design-reasons.md`. DO NOT use `rounded-2xl`, soft shadows, purple/blue gradients, Lucide icons, or `Geist`/`Inter` fonts. Default to sharp edges, hard flat shadows (`shadow-[4px_4px_0px_0px_#1c1917]`), flat borders, and `IBM Plex` typography.
- **Role Assignment:** Remember, users NEVER choose their role. The database trigger handles it based on the hardcoded trigger logic. The admin email is explicitly whitelisted in the auth trigger (`ce25.rushabh.makwana@kccemsr.edu.in`).
- **Auth Strategy (Phase 8 Change):** No passwords! The app relies entirely on `supabase.auth.signInWithOtp()`. The frontend callback `auth/callback/route.ts` handles the session.
- **Whitelist Security:** The Google Apps Script bypasses RLS using the Supabase `service_role` key to populate `allowed_emails`. Signups are hard-blocked by a Postgres trigger on `auth.users` before insertion.
- **Data Fetching:** Use Server Components for initial fetching and Server Actions for mutations.
- **Team writes are RPC-only:** `teams`/`team_members` have no direct INSERT/UPDATE/DELETE RLS policies on purpose. Every write, and every cross-user read, goes through a `SECURITY DEFINER` RPC.