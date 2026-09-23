# AI Handoff & Project State Tracker

**ATTENTION AI ASSISTANT:** 
Whenever a new chat session begins, read this file first to understand the current state of the project. 
**CRITICAL INSTRUCTION:** You must proactively update this file at the end of every significant task or at the end of a session to ensure the next session can resume seamlessly. Maintain the checkboxes (`[x]` for done, `[ ]` for pending, `[-]` for in-progress).

---

## 📅 Project Status Overview
- **Current Phase:** Phase 6 — Final Polish & Deployment Prep
- **Last Updated:** 2026-09-24T03:44:00+05:30
- **Current Blocker/Notes:** Implemented complete user erasure on deletion: when an admin deletes a participant, their uploaded screenshots are removed from the `project_screenshots` Supabase storage bucket, and their account is purged completely from `auth.users` via `delete_user_completely` RPC (which cascades and deletes all profile rows, sessions, and identities). Handled fallback to direct profile deletion. Production build passes cleanly.

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
- [x] **Production build passes with zero errors.**
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
- [-] Verify build compiles without errors. Fix any TypeScript or import issues.

---

## 📝 Pending Backlog (To-Do)

### Phase 2: Database & Auth Setup (Supabase) — USER MUST DO MANUALLY
- [ ] Execute SQL to create `profiles` table (see `files/database_schema.md`).
- [ ] Set up the automated Postgres trigger for assigning the `admin` role (see `files/database_schema.md`).
- [ ] Create the `project_screenshots` public storage bucket in Supabase dashboard.
- [ ] Apply RLS policies for the `profiles` table and storage bucket (see `files/security_protocols.md`).
- [ ] Set `app.settings.admin_email` in Supabase DB settings.

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