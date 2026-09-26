# AI Handoff & Project State Tracker

**ATTENTION AI ASSISTANT:** 
Whenever a new chat session begins, read this file first to understand the current state of the project. 
**CRITICAL INSTRUCTION:** You must proactively update this file at the end of every significant task or at the end of a session to ensure the next session can resume seamlessly. Maintain the checkboxes (`[x]` for done, `[ ]` for pending, `[-]` for in-progress).

---

## Project Status Overview
- **Current Phase:** Phase 6 — Final Polish & Loading States
- **Last Updated:** 2026-09-26T20:59:00+05:30
- **Current Blocker/Notes:** The Vercel deployment succeeded without errors. Real-time Next.js UI updates via Supabase notifications (`router.refresh()`) are now fully operational for all team events (leave, kick, accept, decline). The mobile responsiveness bugs (grid squeezing, email text overflow) and the lingering "generic UI" elements in the Team section have all been successfully upgraded to the responsive Neo-Brutalist (WEB3SKILLBUILDZ) aesthetic. The participant dashboard is essentially feature-complete and styled. The next immediate step is to polish the final rough edges: adding loading states to all forms/buttons to prevent double-clicks, and applying the Neo-Brutalist UI styling to the `ParticipantsTable` on the `/admin` side.

---

## Completed Tasks
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
- [x] Setup Global AI Design Rules (`~/.gemini/config/rules/30-web-design-reasons.md`).
- [x] Overhauled UI to Neo-Brutalist Web3 theme (IBM Plex Mono/Sans, Stone/Charcoal palette, sharp edges).
- [x] Rewrote `/admin` layout to match the new SYS_ADMIN aesthetic.
- [x] Updated the `DashboardNav` and `page.tsx` grids to be fully responsive on mobile.
- [x] Changed the dashboard event name string to "WEB3SKILLBUILDZ".
- [x] Applied the Neo-Brutalist styling to the inner `TeamSection` and its sub-components (PendingInvitations, UserSearch, TeamOverview, etc).
- [x] Set up Real-Time UI auto-refreshing via `useTeamNotifications` and updated SQL notification logic.
- [x] Validated production Vercel deployment (successful build, standard npm warnings).

---

## In Progress
*(Move the currently active task here)*
- [-] Adding global loading states to buttons to prevent double-clicks during async RPC calls.
- [-] Porting `ParticipantsTable` and `AdminTeamsList` to the Neo-Brutalist design system.

---

## Pending Backlog (To-Do)

### Phase 2: Database & Auth Setup (Supabase) — USER MUST DO MANUALLY
- [x] Run the full `files/team_system_schema.sql` in the Supabase SQL editor.
- [x] Setup the `allowed_emails` table and the `enforce_allowed_emails` trigger.
- [x] Create the `project_screenshots` public storage bucket in Supabase dashboard.
- [x] Apply RLS policies for the `profiles` table and storage bucket.
- [x] Setup custom SMTP using Google Workspace app password to bypass Supabase rate limits.
- [x] Added a 60-second cooldown timer to the magic link login UI.
- [x] Corrected database `handle_new_user` trigger to fetch missing `name` and `phone` values from the `allowed_emails` table.
- [x] Corrected `delete_user_completely` RPC to also purge users from the `allowed_emails` whitelist on deletion.
- [x] Fixed team leadership bug: UI and DB now correctly promote team creator to `leader` ONLY after their first outgoing invitation is accepted.
- [x] Added "Leave Team" / "Disband Team" logic to Next.js actions and `TeamOverviewCard.tsx`. Created `leave_team` RPC.

### Phase 6: Final Polish
- [ ] Handle loading states and error handling across all forms.
- [ ] Apply the Neo-Brutalist styling to the `ParticipantsTable` components (Admin side).

---

## Context & Quirks
- **Design System Enforcement:** The user explicitly hates generic AI SaaS design (slop). A strict rule exists in `~/.gemini/config/rules/30-web-design-reasons.md`. DO NOT use `rounded-2xl`, soft shadows, purple/blue gradients, Lucide icons, or `Geist`/`Inter` fonts. Default to sharp edges, hard flat shadows (`shadow-[4px_4px_0px_0px_#1c1917]`), flat borders, and `IBM Plex` typography.
- **Role Assignment:** Remember, users NEVER choose their role. The database trigger handles it based on the hardcoded trigger logic. The admin email is explicitly whitelisted in the auth trigger.
- **Auth Strategy (Phase 8 Change):** No passwords! The app relies entirely on `supabase.auth.signInWithOtp()`. The frontend callback `auth/callback/route.ts` handles the session.
- **Whitelist Security:** The Google Apps Script bypasses RLS using the Supabase `service_role` key to populate `allowed_emails`. Signups are hard-blocked by a Postgres trigger on `auth.users` before insertion.
- **Data Fetching:** Use Server Components for initial fetching and Server Actions for mutations.
- **Team writes are RPC-only:** `teams`/`team_members` have no direct INSERT/UPDATE/DELETE RLS policies on purpose. Every write, and every cross-user read, goes through a `SECURITY DEFINER` RPC.