import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { signOut } from '@/app/actions/auth'
import ParticipantsTable from './_components/ParticipantsTable'
import TeamsPanel from './_components/TeamsPanel'
import LockSubmissionsToggle from './_components/LockSubmissionsToggle'
import PublishScoresToggle from './_components/PublishScoresToggle'
import TeamFormationLockToggle from './_components/TeamFormationLockToggle'
import type { Profile } from '@/lib/types'
import type { AdminTeamSummary } from '@/lib/team/types'

export default async function AdminPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('role, name')
    .eq('id', user.id)
    .single()

  if (!adminProfile || adminProfile.role !== 'admin') redirect('/dashboard')

  const { data: config } = await supabase
    .from('event_config')
    .select('submissions_locked, scores_published, team_formation_locked')
    .eq('id', 1)
    .maybeSingle()

  const isLocked = Boolean(config?.submissions_locked)
  const isScoresPublished = Boolean(config?.scores_published)
  const isTeamFormationLocked = Boolean(config?.team_formation_locked)

  const { data: participants, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  const { data: teamsData, error: teamsError } = await supabase.rpc('admin_list_teams')

  const allProfiles = (participants as Profile[]) ?? []
  const allTeams = (teamsData as AdminTeamSummary[]) ?? []
  const totalSubmissions = allTeams.filter(t => t.projectDescription).length
  const totalReviewed = allTeams.filter(t => t.score !== null && t.score !== undefined).length

  return (
    <div className="min-h-screen bg-stone-100">
      {/* Nav */}
      <header className="bg-white border-b-4 border-stone-900">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-stone-900 border-2 border-stone-900 flex items-center justify-center rotate-[-2deg]">
              <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="square" strokeLinejoin="miter" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>
            <div>
              <span className="font-bold font-mono text-stone-900 uppercase">SkillBuildz</span>
              <span className="ml-2 text-xs font-bold font-mono text-amber-600 border-2 border-amber-600 bg-amber-100 px-1.5 py-0.5 uppercase">
                SYS_ADMIN
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-mono text-stone-600 hidden sm:block uppercase">
              Organizer: <span className="font-bold text-stone-900">{adminProfile.name}</span>
            </span>
            <form action={signOut}>
              <button
                type="submit"
                className="text-sm font-bold font-mono text-stone-900 hover:text-white transition px-4 py-2 hover:bg-red-500 border-2 border-stone-900 shadow-[2px_2px_0px_0px_#1c1917] active:shadow-none active:translate-y-[2px] active:translate-x-[2px] uppercase"
              >
                Terminate
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10 space-y-8">
        {/* Title + Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-amber-400 p-6 border-2 border-stone-900 shadow-[8px_8px_0px_0px_#1c1917]">
          <div>
            <h2 className="text-2xl font-bold font-mono text-stone-900 uppercase tracking-tighter">Event Controls & Telemetry</h2>
            <p className="text-sm font-medium text-stone-800 mt-1">
              Control submission window, review projects, assign scores, and publish results to participants.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <TeamFormationLockToggle isLocked={isTeamFormationLocked} />
            <LockSubmissionsToggle isLocked={isLocked} />
            <PublishScoresToggle isPublished={isScoresPublished} />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
          <div className="bg-white border-2 border-stone-900 shadow-[4px_4px_0px_0px_#1c1917] p-5 rounded-none">
            <p className="text-xs font-bold font-mono text-stone-900 uppercase tracking-widest mb-1">Total Users</p>
            <p className="text-4xl font-bold font-mono text-stone-900">{allProfiles.length}</p>
          </div>
          <div className="bg-white border-2 border-stone-900 shadow-[4px_4px_0px_0px_#1c1917] p-5 rounded-none">
            <p className="text-xs font-bold font-mono text-stone-900 uppercase tracking-widest mb-1">Teams Submitted</p>
            <p className="text-4xl font-bold font-mono text-blue-600">{totalSubmissions} / {allTeams.length}</p>
          </div>
          <div className="bg-white border-2 border-stone-900 shadow-[4px_4px_0px_0px_#1c1917] p-5 rounded-none">
            <p className="text-xs font-bold font-mono text-stone-900 uppercase tracking-widest mb-1">Teams Scored</p>
            <p className="text-4xl font-bold font-mono text-purple-600">{totalReviewed} / {allTeams.length}</p>
          </div>
          <div className="bg-stone-900 border-2 border-stone-900 shadow-[4px_4px_0px_0px_#fde047] p-5 rounded-none text-white">
            <p className="text-xs font-bold font-mono text-amber-400 uppercase tracking-widest mb-1">Results Status</p>
            <div className="mt-1">
              {isScoresPublished ? (
                <span className="inline-flex items-center gap-2 px-3 py-1 text-xs font-bold font-mono bg-blue-400 text-stone-900 border-2 border-stone-900 uppercase">
                  [ LIVE TO USERS ]
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 px-3 py-1 text-xs font-bold font-mono bg-stone-200 text-stone-800 border-2 border-stone-900 uppercase">
                  [ HIDDEN ]
                </span>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="text-sm font-bold font-mono text-red-900 bg-red-100 border-2 border-red-900 rounded-none px-4 py-3 uppercase">
            ERR LOADING PROFILES: {error.message}
          </div>
        )}
        {teamsError && (
          <div className="text-sm font-bold font-mono text-red-900 bg-red-100 border-2 border-red-900 rounded-none px-4 py-3 uppercase">
            ERR LOADING TEAMS: {teamsError.message}
            <div className="mt-2 text-xs font-normal">
              Did you forget to run the team_system_schema.sql script in your Supabase SQL editor?
            </div>
          </div>
        )}

        {/* Teams */}
        <div className="border-t-4 border-stone-900 pt-8 mt-8">
          <TeamsPanel teams={allTeams} />
        </div>

        {/* Participants (account management) */}
        <div className="border-t-4 border-stone-900 pt-8 mt-8">
          <ParticipantsTable profiles={allProfiles} />
        </div>
      </main>
    </div>
  )
}
