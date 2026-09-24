# AI Handoff & Project State Tracker

**ATTENTION AI ASSISTANT:** 
Whenever a new chat session begins, read this file first to understand the current state of the project. 
**CRITICAL INSTRUCTION:** You must proactively update this file at the end of every significant task or at the end of a session to ensure the next session can resume seamlessly. Maintain the checkboxes (`[x]` for done, `[ ]` for pending, `[-]` for in-progress).

---

## 📅 Project Status Overview
- **Current Phase:** Phase 7 — Team-Level Scoring & Public Leaderboard
- **Last Updated:** 2026-09-24T20:00:00+05:30
- **Current Blocker/Notes:** Moved scoring and project submission from per-individual (`profiles`) to per-team (`teams`), so results are ranked by team instead of by participant. Added a team-locking mechanism (leader self-lock via "Lock My Team", or admin global "Lock Team Formation" force-lock) that gates submission (a team must be locked before it can submit) and freezes membership once locked. Built a public (any signed-in user) leaderboard with a top-3 podium at `/dashboard/results`, gated by the existing "Publish Scores" toggle. `DashboardNav`'s previously-dead `activeTab` prop now actually renders Home/Submission/Results tabs. `npm run build` and `npm test` both pass. ⚠️ **The new SQL (the "Phase 2: team-level submission, scoring, and locking" section at the bottom of `files/team_system_schema.sql`) has NOT been run against the live Supabase project yet** — must be applied via the Supabase SQL editor before this code will work against real data (see Pending Backlog).

---

## ✅ Completed Tasks
*(Move items here once fully implemented and tested)*
- [x] Initial project documentation and architecture planning curated.
- [x] Read all `.md` specification files to understand the project scope.
- [x] Initialize Next.js App Router project with Tailwind CSS.
- [x] Install dependencies: `@supabase/supabase-js`, `@supabase/ssr`, `lucide-react`.
- [x] Configure environment variables (`.env.local` with placeholders — user needs to fill in real values).
- [x] Create `src/lib/supabase/server.ts` — server-side Supabase client using `@supabase/ssr`.
- [x] Create `src/lib/supabase/client.ts` — browser-side Supabase client.
- [x] Create `src/lib/types.ts` — shared `Profile`, `UserRole`, and `EventConfig` types.
- [x] Create `src/proxy.ts` — route protection and role-based redirection (migrated from deprecated `middleware.ts` to `proxy.ts` per Next.js 16 convention).
- [x] Create `src/app/actions/auth.ts` — `signUp`, `signIn`, `signOut` server actions.
- [x] Create `src/app/actions/project.ts` — `submitProject`, `updateParticipant`, `deleteParticipant`, `promoteToAdmin`, `revertSubmission`, `toggleSubmissionsLock`, `toggleScoresPublished`, `scoreSubmission` server actions.
- [x] Create `src/app/auth/callback/route.ts` — Supabase auth callback route handler.
- [x] Create `src/app/_components/LoginForm.tsx` — Login form with `useActionState`.
- [x] Create `src/app/_components/RegisterForm.tsx` — Register form (Name, Email, Phone, Password).
- [x] Create `src/app/_components/AuthTabs.tsx` — Tab switcher between Login/Register.
- [x] Update `src/app/page.tsx` — Landing page with Auth UI and SkillBuildz branding.
- [x] Create `src/app/dashboard/page.tsx` — Participant dashboard (Server Component).
- [x] Create `src/app/dashboard/_components/SubmissionForm.tsx` — File upload + project submission form.
- [x] Create `src/app/dashboard/_components/SubmissionPreview.tsx` — Submitted project display card.
- [x] Create `src/app/admin/page.tsx` — Admin dashboard with stats and controls (Server Component).
- [x] Create `src/app/admin/_components/ParticipantsTable.tsx` — Full CRUD table with search, expand rows, edit/delete modals, promote to admin.
- [x] Fix TypeScript `useActionState` type errors (changed `string | null` → `string`).
- [x] Migrate `middleware.ts` → `proxy.ts` (Next.js 16 breaking change).
- [x] Implement Participant Edit & Revert/Withdraw submission flow (`ParticipantSubmissionSection.tsx`, `revertSubmission`).
- [x] Implement Global Submission Lock feature (`event_config` table, `LockSubmissionsToggle.tsx`, server action enforcement).
- [x] Implement Admin Review & Scoring modal with feedback notes (`ReviewModal.tsx`, `scoreSubmission`).
- [x] Implement "Publish Scores" control (`PublishScoresToggle.tsx`, `toggleScoresPublished`, gated participant score view).
- [x] Fix admin authorization checking in Server Actions with `checkIsAdmin` helper.
- [x] Implement complete user and asset erasure on delete (Storage cleanup + `auth.users` purge cascading to `profiles` and auth sessions).
- [x] Integrate Agentation visual feedback toolbar.
- [x] Added navigation bar elements to Participant Dashboard (Search Bar, Submission, Result buttons) and widened layout to `max-w-5xl`.
- [x] Split dashboard into home page (`/dashboard`) and submission page (`/dashboard/submit`); extracted `DashboardNav` shared component.
- [x] Moved submission + scoring from `profiles` to `teams` (team-level, not individual): new `teams` columns (`project_description`, `deploy_link`, `screenshot_url`, `score`, `feedback`, `is_locked`, `locked_at`), dropped the five equivalent columns from `profiles`.
- [x] Added team locking: `lock_team()` (leader self-lock), `unlock_team()` (admin), `set_team_formation_lock()` (admin global force-lock via new `event_config.team_formation_locked`). Locked teams have membership frozen (`send_team_invitation`/`accept_team_invitation`/`remove_team_member` all reject with `TEAM_LOCKED`).
- [x] `submit_team_project()`/`revert_team_submission()` RPCs — any team member can submit/edit, gated on team being locked AND the existing global `submissions_locked` toggle being off.
- [x] `ensureSoloTeam()` server action — auto-creates a solo team ("{FirstName}'s Team") the first time a teamless participant clicks "Get Started" on the submit page.
- [x] Admin scoring moved to `score_team()` RPC + new `TeamsPanel.tsx`/`TeamScoreModal.tsx` (replaces per-participant `ReviewModal.tsx`, deleted). `admin_list_teams()` RPC powers the panel.
- [x] Trimmed `ParticipantsTable.tsx` back to pure account management (search/edit/delete/promote) — score/status/review columns removed.
- [x] New public leaderboard: `src/app/dashboard/results/page.tsx` + `Podium.tsx` + `LeaderboardList.tsx`, powered by `get_leaderboard()` RPC, gated by `event_config.scores_published`. Standard competition ranking (ties share a rank) computed client-side.
- [x] `DashboardNav.tsx`'s `activeTab` prop now renders real Home/Submission/Results nav links (was previously accepted but unused).
- [x] `TeamOverviewCard.tsx` shows lock status + leader-only "Lock My Team" button; `UserSearchPanel` hidden once a team is locked.
- [x] **Production build passes with zero errors; `npm test` (33 tests in `rules.test.ts`) passes.**
- [x] Create `src/lib/supabase/server.ts` — server-side Supabase client using `@supabase/ssr`.
- [x] Create `src/lib/supabase/client.ts` — browser-side Supabase client.
- [x] Create `src/lib/types.ts` — shared `Profile` and `UserRole` types.
- [x] Create `src/middleware.ts` — route protection and role-based redirection.
- [x] Create `src/app/actions/auth.ts` — `signUp`, `signIn`, `signOut` server actions.
- [x] Create `src/app/actions/project.ts` — `submitProject`, `updateParticipant`, `deleteParticipant`, `promoteToAdmin` server actions.
- [x] Create `src/app/auth/callback/route.ts` — Supabase auth callback route handler.
- [x] Create `src/app/_components/LoginForm.tsx` — Login form with `useActionState`.
- [x] Create `src/app/_components/RegisterForm.tsx` — Register form (Name, Email, Phone, Password).
- [x] Create `src/app/_components/AuthTabs.tsx` — Tab switcher between Login/Register.
- [x] Update `src/app/page.tsx` — Landing page with Auth UI.
- [x] Create `src/app/dashboard/page.tsx` — Participant dashboard (Server Component).
- [x] Create `src/app/dashboard/_components/SubmissionForm.tsx` — File upload + project submission form.
- [x] Create `src/app/dashboard/_components/SubmissionPreview.tsx` — Submitted project display card.
- [x] Create `src/app/admin/page.tsx` — Admin dashboard with stats (Server Component).
- [x] Create `src/app/admin/_components/ParticipantsTable.tsx` — Full CRUD table with search, expand, edit/delete modals, promote to admin.

---

## 🚧 In Progress
*(Move the currently active task here)*
- [-] Run the new "Phase 2: team-level submission, scoring, and locking" SQL block (bottom of `files/team_system_schema.sql`) against the live Supabase project — nothing in this phase works against real data until that's applied.

---

## 📝 Pending Backlog (To-Do)

### Phase 2: Database & Auth Setup (Supabase) — USER MUST DO MANUALLY
- [ ] Execute SQL to create `profiles` table (see `files/database_schema.md`).
- [ ] Set up the automated Postgres trigger for assigning the `admin` role (see `files/database_schema.md`).
- [ ] Create the `project_screenshots` public storage bucket in Supabase dashboard.
- [ ] Apply RLS policies for the `profiles` table and storage bucket (see `files/security_protocols.md`).
- [ ] Set `app.settings.admin_email` in Supabase DB settings.
- [ ] Run the full `files/team_system_schema.sql` (including the new "Phase 2" section at the bottom) in the Supabase SQL editor — idempotent/safe to re-run.

### Phase 7: Team Scoring — Follow-ups
- [ ] End-to-end manual test against a real Supabase project once the SQL above is applied (see the Verification section of the team-scoring plan: form a team, lock it, submit, admin scores it, publish, check podium; solo-auto-team path; admin unlock; global force-lock).
- [ ] Cleanup (flagged, not urgent): `profiles.team_id` is dead code (real membership lives in `team_members`) — safe to drop later. Also, deleting a team leader's account still cascades (`teams.leader_id ON DELETE CASCADE`) to delete the whole team including its submission/score — pre-existing behavior, worth a real fix later (e.g. reassign leadership before allowing deletion) but not addressed in this pass.

### Phase 6: Final Polish
- [ ] Handle loading states and error handling across all forms (partially done via `useActionState`).
- [ ] Final UI/UX polish with Tailwind CSS.
- [ ] Prep for deployment on Vercel (see `files/deployment_guide.md`).

---

## 🧠 Context & Quirks
*(AI: Log any specific architectural decisions, workarounds, or bugs you encounter here so you don't forget them in the next session.)*
- **Role Assignment:** Remember, users NEVER choose their role. The database trigger handles it based on the `NEXT_PUBLIC_ADMIN_EMAIL` env variable (via `app.settings.admin_email` Postgres setting).
- **Data Fetching:** Use Server Components for initial fetching and Server Actions for mutations.
- **File Structure:** Uses `src/app` layout (not bare `app`). All components live in `src/app/`.
- **Supabase SSR:** Uses `@supabase/ssr` with `createServerClient` for server and `createBrowserClient` for client. Cookie handling is done in `src/lib/supabase/server.ts`.
- **File Upload:** Screenshot upload is done client-side to Supabase Storage, then the public URL is passed as a hidden form field to the Server Action.
- **Admin CRUD:** All admin mutations check that the calling user has `role = 'admin'` server-side before executing.
- **Auth Callback:** `/auth/callback` route is at `src/app/auth/callback/route.ts` for Supabase email confirmation flows.
- **Setup Quirk:** During init, the `files/` folder was temporarily moved out to allow `create-next-app` to scaffold (it requires an empty directory). It was restored afterwards.
- **Team writes are RPC-only:** `teams`/`team_members` have no direct INSERT/UPDATE/DELETE RLS policies on purpose (see comments in `files/team_system_schema.sql`) — every write, and every cross-user read (admin listing, the public leaderboard), goes through a `SECURITY DEFINER` RPC instead, so business rules (capacity, locking, one-team-per-user) are backend-enforced rather than a UI convention. Follow this same pattern for any future team-table changes rather than adding RLS policies.
- **Two independent locks:** `teams.is_locked` (gates submission, freezes membership) and `event_config.submissions_locked` (the pre-existing global submission-window toggle) are separate and both must be satisfied to submit/edit a project. Don't conflate them.
- **Score is on `teams`, not `profiles`:** individual-level `score`/`feedback`/submission columns were dropped from `profiles` entirely in this change (test data only, no migration needed). If any old code or docs still reference `profile.score` etc., that's stale — team is the sole scoring unit now.