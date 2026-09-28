# AI Handoff & Project State Tracker

**ATTENTION AI ASSISTANT:** 
Whenever a new chat session begins, read this file first to understand the current state of the project. 
**CRITICAL INSTRUCTION:** You must proactively update this file at the end of every significant task or at the end of a session to ensure the next session can resume seamlessly. Maintain the checkboxes (`[x]` for done, `[ ]` for pending, `[-]` for in-progress).

---

## Project Status Overview
- **Current Phase:** Phase 7 — Bug-Free & Production Ready (Adding manual participants)
- **Last Updated:** 2026-09-29T00:32:00+05:30
- **Current Blocker/Notes:** Working on forcefully adding a new participant to Supabase. Needs to bypass or utilize the `allowed_emails` whitelist. No major blockers.

---

## Completed Tasks
*(Move items here once fully implemented and tested)*
- [x] **Ghost Team Cleanup**: Wrote `fix_leave_team.sql` to overhaul the `leave_team` RPC. Now when a leader leaves, the team row is fully cascade-deleted (wiping members, submissions, and invites), preventing empty ghost teams from cluttering the admin table.
- [x] **Neo-Brutalized Leaderboard**: Stripped soft SaaS styling from `LeaderboardList.tsx` and `Podium.tsx` and applied strict Neo-Brutalist borders and hard shadows.
- [x] **Add Participant Admin UI**: Created `admin_add_allowed_email` RPC to bypass RLS, built Server Action, and added `AddParticipantModal` to the admin dashboard.
- [x] **Full 36-bug audit & fix pass.** All critical, medium, and minor bugs resolved. TypeScript passes with zero errors. See "Bug Fix Session" section below for full details.
- [x] Added global loading states to buttons to prevent double-clicks during async RPC calls.
- [x] Ported all Admin components (ParticipantsTable, TeamsPanel, TeamScoreModal) to the strict Neo-Brutalist design system.
- [x] Implemented Team Renaming: Added rename_team RPC, action, and UI.
- [x] Confirmed Solo Participant submit workflow (team of 1 lock).
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

---

## Pending Backlog (To-Do)

### USER ACTION REQUIRED
- [x] **Rename env var:** In `.env.local` AND in Vercel dashboard environment variables, renamed `NEXT_PUBLIC_ADMIN_EMAIL` → `ADMIN_EMAIL`. ✅ Done.
- [x] **Run `rename_team` SQL:** Executed `files/rename_team.sql` in the Supabase SQL editor. ✅ Done.
- [ ] **Run `admin_add_participant.sql`:** Execute this in the Supabase SQL editor to create the `admin_add_allowed_email` RPC.
- [ ] **Run `fix_leave_team.sql`:** Execute this in the Supabase SQL editor to fix the ghost team bug and cascade delete disbanded teams.

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
- [x] Handle loading states and error handling across all forms.
- [x] Apply the Neo-Brutalist styling to the `ParticipantsTable` components (Admin side).

### Phase 7: Launch Prep (2026-09-28 & 2026-09-29)
- [x] **Google Apps Script Fix**: Modified Google Forms sync script (syncAllExistingResponses) to include ?on_conflict=email in the PostgREST URL so merge-duplicates correctly upserts missing 
ame and phone data for old rows instead of failing silently.
- [x] **Notification UI Feedback**: Overhauled the TeamSection alerts button to provide native browser popups ("Alerts Enabled" / "Alerts Blocked") and transform into a permanent disabled status badge.
- [x] **Remote UI Merge**: Pulled and verified the new Mascot, UserAvatar, and updated Podium.tsx components from remote origin/main. Resolved stash safely.
- [x] **Custom Domain Setup**: Documented environment & Supabase URL configuration for the new domain (`web3.singularityhack.in`).
- [x] **Custom Favicon**: Created a custom Neo-Brutalist SVG favicon (`icon.svg`) matching the internal SYS_ADMIN logo and removed the default Next.js favicon.

---

## Bug Fix Session (2026-09-27) — 36 Bugs Fixed

### Critical Fixes
| ID | File | Fix |
|---|---|---|
| BUG-01 | `auth/callback/route.ts` | Auth failure no longer silently ignored. Failed exchange redirects to `/?error=auth_failed`. Missing code redirects to `/`. |
| BUG-02 | `actions/auth.ts` | Email domain check changed from `.includes()` to `.endsWith()` — blocks subdomain bypass attacks. |
| BUG-04 | `actions/project.ts` | `NEXT_PUBLIC_ADMIN_EMAIL` → `ADMIN_EMAIL` (server-only). Admin email no longer leaked to client JS bundle. **User must rename env var manually.** |
| BUG-26 | `TeamsPanel.tsx` | Replaced shared `loading` bool with `loadingId: string\|null` — each row's Unlock button is independent. |
| BUG-28 | `ParticipantsTable.tsx` | Edit and Delete modals can no longer be open simultaneously. `actionError` is properly isolated per operation. |

### Medium Fixes
| ID | File | Fix |
|---|---|---|
| BUG-03 | `actions/auth.ts` | `signOut` error is now logged (not silently discarded). |
| BUG-05 | `actions/project.ts` | FormData `.get()` results safely coerced with `?? ''` instead of unsafe `as string` cast. |
| BUG-07 | `actions/project.ts` | `revertSubmission` now deletes the orphaned screenshot from Supabase storage before calling the RPC. |
| BUG-08 | `proxy.ts` | `/admin` routes now check `role === 'admin'` from `public.profiles`. Non-admin authenticated users are redirected to `/dashboard`. |
| BUG-09 | `useTeamNotifications.ts` | `router` added to `useEffect` dependency array. |
| BUG-16 | `UserSearchPanel.tsx` | `setCooldownUntil` moved to the success branch — no cooldown applied when invite fails. |
| BUG-19 | `SubmissionForm.tsx` | Old screenshot deleted from storage before a new one is uploaded (no more orphaned blobs). |
| BUG-20 | `SubmissionForm.tsx` | `URL.createObjectURL()` blobs are revoked via `useEffect` cleanup — memory leak fixed. |
| BUG-29 | `ParticipantsTable.tsx` | Promote errors now display inline instead of via `alert()`. |
| BUG-30 | `ParticipantsTable.tsx` | `p.phone.toLowerCase()` → `(p.phone ?? '').toLowerCase()` — no more null crash. |

### Minor Fixes
| ID | File | Fix |
|---|---|---|
| BUG-12 | `TeamOverviewCard.tsx` | Rename input now has `maxLength={60}`. |
| BUG-14 | `TeamOverviewCard.tsx` | Pressing Enter in rename input now submits the rename. |
| BUG-15 | `TeamOverviewCard.tsx` | `renameError` is cleared when the rename modal opens. |
| BUG-17 | `UserSearchPanel.tsx` | Empty query no longer triggers a search on mount — shows empty results instead. |
| BUG-22 | `SubmissionForm.tsx` | File type error uses inline state instead of `alert()`. |
| BUG-23 | `SubmissionForm.tsx` | File size validated client-side (max 10MB) before upload attempt. |
| BUG-24 | `SubmissionPreview.tsx` | Full Neo-Brutalist restyle — no more `rounded-2xl`, soft shadows, or gradient backgrounds. |
| BUG-25 | `SubmissionPreview.tsx` | Deploy link fallback changed from `'#'` to `''`. |
| BUG-27 | `TeamsPanel.tsx` | "Submitted" badge now requires all three fields (description + link + screenshot). |
| BUG-31 | `ParticipantsTable.tsx` | Edit modal validates non-empty name and email before saving. |
| BUG-32 | `TeamScoreModal.tsx` | `setTimeout` stored in `ref` and cleared on unmount — no leak. |
| BUG-33 | `TeamScoreModal.tsx` | `hasSubmission` now requires all three fields (AND instead of OR). |
| BUG-35 | `actions/team.ts` | Screenshot URL parsing uses `new URL()` constructor instead of fragile string split. |
| BUG-36 | `lib/team/rules.ts` | `canRemoveMember` returns `NO_TEAM` (not `NOT_LEADER`) when caller has no team. |

---

## Context & Quirks
- **Design System Enforcement:** The user explicitly hates generic AI SaaS design (slop). A strict rule exists in `~/.gemini/config/rules/30-web-design-reasons.md`. DO NOT use `rounded-2xl`, soft shadows, purple/blue gradients, Lucide icons, or `Geist`/`Inter` fonts. Default to sharp edges, hard flat shadows (`shadow-[4px_4px_0px_0px_#1c1917]`), flat borders, and `IBM Plex` typography.
- **Role Assignment:** Remember, users NEVER choose their role. The database trigger handles it based on the hardcoded trigger logic. The admin email is explicitly whitelisted in the auth trigger.
- **Auth Strategy:** No passwords! The app relies entirely on `supabase.auth.signInWithOtp()`. The frontend callback `auth/callback/route.ts` handles the session.
- **Whitelist Security:** The Google Apps Script bypasses RLS using the Supabase `service_role` key to populate `allowed_emails`. Signups are hard-blocked by a Postgres trigger on `auth.users` before insertion.
- **Data Fetching:** Use Server Components for initial fetching and Server Actions for mutations.
- **Team writes are RPC-only:** `teams`/`team_members` have no direct INSERT/UPDATE/DELETE RLS policies on purpose. Every write, and every cross-user read, goes through a `SECURITY DEFINER` RPC.
- **Admin env var:** Admin role check uses `process.env.ADMIN_EMAIL` (NOT `NEXT_PUBLIC_ADMIN_EMAIL`). The env var must NOT have the `NEXT_PUBLIC_` prefix or it leaks to the client bundle.
- **SMTP Scalability:** Default Supabase SMTP is restricted to 3 emails/hour. Custom SMTP is configured via Google Workspace, which raises limits to ~2,000/day. For heavy live event traffic (e.g. hundreds of simultaneous logins), institutional SMTPs may still throttle; transactional APIs (Resend/SendGrid) remain the ideal scaling path.


