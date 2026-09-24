import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { signOut } from '@/app/actions/auth'
import Link from 'next/link'
import DashboardNav from './_components/DashboardNav'
import type { Profile, Team } from '@/lib/types'

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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-2xl border border-red-200 shadow-sm p-8 max-w-md text-center space-y-4">
          <p className="text-red-600 font-semibold text-lg">⚠️ Could not load your profile</p>
          <p className="text-sm text-gray-600">
            {profileError ? `Database error: ${profileError.message}` : 'Your account exists in Auth, but your record in the profiles table could not be found.'}
          </p>
          {profileError?.hint && (
            <p className="text-xs text-gray-500 bg-gray-100 p-2 rounded">
              Hint: {profileError.hint}
            </p>
          )}
          <div className="pt-2">
            <form action={signOut}>
              <button type="submit" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition">
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
  const hasSubmitted = !!(profile.project_description && profile.deploy_link && profile.screenshot_url)

  // Fetch team data if the participant belongs to a team
  let team: Team | null = null
  let teamMembers: Pick<Profile, 'id' | 'name' | 'email' | 'phone'>[] = []

  if (profile.team_id) {
    const [{ data: teamData }, { data: members }] = await Promise.all([
      supabase.from('teams').select('*').eq('id', profile.team_id).maybeSingle<Team>(),
      supabase
        .from('profiles')
        .select('id, name, email, phone')
        .eq('team_id', profile.team_id)
        .neq('id', profile.id),
    ])
    team = teamData
    teamMembers = (members as Pick<Profile, 'id' | 'name' | 'email' | 'phone'>[] | null) ?? []
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav profileName={profile.name} activeTab="home" />

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-8">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-2xl p-8 text-white">
          <p className="text-indigo-200 text-sm font-medium mb-1">Welcome back</p>
          <h1 className="text-3xl font-bold mb-2">{profile.name}</h1>
          <p className="text-indigo-100 text-sm">
            {hasSubmitted
              ? "Your project has been submitted. Check back here for results."
              : isLocked
              ? "Submissions are currently closed. Stay tuned for updates."
              : "You haven't submitted your project yet. Head over to the Submission page to get started."}
          </p>
        </div>

        {/* Status + Actions Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Submission Status */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Submission Status</p>
            {hasSubmitted ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold bg-green-100 text-green-800 w-fit">
                <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                Submitted
              </span>
            ) : isLocked ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold bg-amber-100 text-amber-800 w-fit">
                <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                Closed
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold bg-yellow-100 text-yellow-800 w-fit">
                <span className="w-2 h-2 rounded-full bg-yellow-500 inline-block" />
                Pending
              </span>
            )}
            <Link
              href="/dashboard/submit"
              className="mt-auto text-sm font-medium text-indigo-600 hover:text-indigo-700 transition"
            >
              {hasSubmitted ? 'View / Edit →' : isLocked ? 'View details →' : 'Submit now →'}
            </Link>
          </div>

          {/* Results Status */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Results</p>
            {isScoresPublished ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold bg-blue-100 text-blue-800 w-fit">
                <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                Published
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold bg-gray-100 text-gray-600 w-fit">
                <span className="w-2 h-2 rounded-full bg-gray-400 inline-block" />
                Not yet
              </span>
            )}
            <Link
              href="/dashboard/results"
              className="mt-auto text-sm font-medium text-indigo-600 hover:text-indigo-700 transition"
            >
              View results →
            </Link>
          </div>

          {/* Event Info */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Event</p>
            <p className="text-sm font-semibold text-gray-900">SkillBuildz Hackathon</p>
            <p className="text-xs text-gray-400">
              {isLocked ? 'Submissions have closed.' : 'Submissions are open.'}
            </p>
          </div>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Your Profile</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-gray-400">Name</p>
              <p className="font-medium text-gray-900">{profile.name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Email</p>
              <p className="font-medium text-gray-900">{profile.email}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Phone</p>
              <p className="font-medium text-gray-900">{profile.phone}</p>
            </div>
          </div>
        </div>

        {/* Team Section */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">My Team</h3>
            {team && (
              <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                {team.name}
              </span>
            )}
          </div>

          {!profile.team_id ? (
            <div className="flex flex-col items-center justify-center py-8 text-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">You're not in a team yet</p>
                <p className="text-xs text-gray-400 mt-1">Join or create a team to collaborate with others.</p>
              </div>
              <button
                type="button"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition"
              >
                Create Team
              </button>
            </div>
          ) : teamMembers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">You're the only one here</p>
                <p className="text-xs text-gray-400 mt-1">No other members have joined your team yet.</p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {teamMembers.map((member) => (
                <div key={member.id} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                  <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                    <span className="text-sm font-semibold text-indigo-600">
                      {member.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{member.name}</p>
                    <p className="text-xs text-gray-400 truncate">{member.email}</p>
                  </div>
                  <span className="ml-auto text-xs text-gray-400 shrink-0">{member.phone}</span>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>
    </div>
  )
}
