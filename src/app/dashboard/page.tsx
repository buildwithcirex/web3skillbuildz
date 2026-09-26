import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { signOut } from '@/app/actions/auth'
import Link from 'next/link'
import DashboardNav from './_components/DashboardNav'
import TeamSection from './_components/team/TeamSection'
import type { Profile } from '@/lib/types'
import type { MyInvitations, Team } from '@/lib/team/types'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle<Profile>()

  if (profileError) {
    console.error('Error fetching profile:', profileError)
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-100 p-4">
        <div className="bg-white rounded-none border-2 border-red-900 p-8 max-w-md text-center space-y-4">
          <p className="text-red-700 font-bold font-mono text-lg uppercase">ERR: Profile Not Found</p>
          <p className="text-sm text-stone-600">
            {profileError ? `Database error: ${profileError.message}` : 'Your account exists in Auth, but your record in the profiles table could not be found.'}
          </p>
          {profileError?.hint && (
            <p className="text-xs text-stone-500 bg-stone-100 p-2 border-2 border-stone-200">
              Hint: {profileError.hint}
            </p>
          )}
          <div className="pt-2">
            <form action={signOut}>
              <button type="submit" className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-none text-sm font-bold font-mono uppercase transition border-2 border-stone-900">
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  if (profile.role === 'admin') redirect('/admin')

  const { data: config } = await supabase
    .from('event_config')
    .select('submissions_locked, scores_published')
    .eq('id', 1)
    .maybeSingle()

  const isLocked = Boolean(config?.submissions_locked)
  const isScoresPublished = Boolean(config?.scores_published)

  const { data: team } = await supabase.rpc('get_my_team')
  const { data: myInvitations } = await supabase.rpc('get_my_invitations')

  const typedTeam = (team as Team | null) ?? null
  const hasSubmitted = !!(typedTeam?.projectDescription && typedTeam?.deployLink && typedTeam?.screenshotUrl)

  return (
    <div className="min-h-screen bg-stone-100">
      <DashboardNav profileName={profile.name} activeTab="home" />

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-8">
        {/* Welcome Banner */}
        <div className="bg-amber-400 border-2 border-stone-900 p-8 text-stone-900 rounded-none shadow-none">
          <p className="text-stone-700 font-mono text-sm font-bold uppercase tracking-widest mb-1">Welcome back</p>
          <h1 className="text-4xl font-bold font-mono uppercase tracking-tighter mb-2">{profile.name}</h1>
          <p className="text-stone-800 text-sm font-medium">
            {hasSubmitted
              ? "Project payload verified. Awaiting admin scoring."
              : isLocked
              ? "SUBMISSIONS LOCKED. Gateway closed."
              : "SYSTEM READY. Awaiting project payload. Proceed to Submission."}
          </p>
        </div>

        {/* Status + Actions Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Submission Status */}
          <div className="bg-white border-2 border-stone-900 p-5 flex flex-col gap-3 rounded-none">
            <p className="text-xs font-bold font-mono text-stone-900 uppercase tracking-widest">Submission</p>
            {hasSubmitted ? (
              <span className="inline-flex items-center gap-2 px-3 py-1.5 border-2 border-stone-900 text-sm font-bold bg-green-400 text-stone-900 w-fit uppercase font-mono">
                <span className="w-2 h-2 bg-stone-900 inline-block rounded-none" />
                Submitted
              </span>
            ) : isLocked ? (
              <span className="inline-flex items-center gap-2 px-3 py-1.5 border-2 border-stone-900 text-sm font-bold bg-red-400 text-stone-900 w-fit uppercase font-mono">
                <span className="w-2 h-2 bg-stone-900 inline-block rounded-none" />
                Locked
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 px-3 py-1.5 border-2 border-stone-900 text-sm font-bold bg-amber-200 text-stone-900 w-fit uppercase font-mono">
                <span className="w-2 h-2 bg-stone-900 inline-block rounded-none animate-pulse" />
                Pending
              </span>
            )}
            <Link
              href="/dashboard/submit"
              className="mt-auto text-sm font-bold font-mono uppercase text-stone-900 hover:bg-stone-900 hover:text-white transition px-2 py-1 border-2 border-transparent hover:border-stone-900 w-fit"
            >
              {hasSubmitted ? '[ VIEW PAYLOAD ]' : isLocked ? '[ VIEW LOGS ]' : '[ INITIALIZE ]'}
            </Link>
          </div>

          {/* Results Status */}
          <div className="bg-white border-2 border-stone-900 p-5 flex flex-col gap-3 rounded-none">
            <p className="text-xs font-bold font-mono text-stone-900 uppercase tracking-widest">Results</p>
            {isScoresPublished ? (
              <span className="inline-flex items-center gap-2 px-3 py-1.5 border-2 border-stone-900 text-sm font-bold bg-blue-400 text-stone-900 w-fit uppercase font-mono">
                <span className="w-2 h-2 bg-stone-900 inline-block rounded-none" />
                Published
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 px-3 py-1.5 border-2 border-stone-900 text-sm font-bold bg-stone-200 text-stone-600 w-fit uppercase font-mono">
                <span className="w-2 h-2 bg-stone-600 inline-block rounded-none" />
                Standby
              </span>
            )}
            <Link
              href="/dashboard/results"
              className="mt-auto text-sm font-bold font-mono uppercase text-stone-900 hover:bg-stone-900 hover:text-white transition px-2 py-1 border-2 border-transparent hover:border-stone-900 w-fit"
            >
              [ LEADERBOARD ]
            </Link>
          </div>

          {/* Event Info */}
          <div className="bg-stone-900 text-white border-2 border-stone-900 p-5 flex flex-col gap-3 rounded-none">
            <p className="text-xs font-bold font-mono text-amber-400 uppercase tracking-widest">Event Data</p>
            <p className="text-lg font-bold font-mono uppercase">WEB3SKILLBUILDZ</p>
            <p className="text-xs text-stone-400 font-mono">
              {isLocked ? 'GATE: CLOSED' : 'GATE: OPEN'}
            </p>
          </div>
        </div>

        {/* Profile Card */}
        <div className="bg-white border-2 border-stone-900 p-6 rounded-none">
          <h3 className="text-sm font-bold font-mono text-stone-900 uppercase tracking-widest mb-4 pb-2 border-b-2 border-stone-200">Operator Identity</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-xs font-bold font-mono text-stone-500 uppercase mb-1">Name</p>
              <p className="font-bold text-stone-900">{profile.name}</p>
            </div>
            <div>
              <p className="text-xs font-bold font-mono text-stone-500 uppercase mb-1">ID</p>
              <p className="font-bold text-stone-900 font-mono break-all">{profile.email}</p>
            </div>
            <div>
              <p className="text-xs font-bold font-mono text-stone-500 uppercase mb-1">Comm</p>
              <p className="font-bold text-stone-900 font-mono break-all">{profile.phone}</p>
            </div>
          </div>
        </div>

        {/* Team Section */}
        <div className="border-t-4 border-stone-900 pt-8 mt-8">
          <TeamSection
            currentUserId={user.id}
            team={typedTeam}
            invitations={(myInvitations as MyInvitations | null) ?? { incoming: [], outgoing: [] }}
          />
        </div>
      </main>
    </div>
  )
}
