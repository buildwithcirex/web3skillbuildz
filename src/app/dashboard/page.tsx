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

  const { data: team } = await supabase.rpc('get_my_team')
  const { data: myInvitations } = await supabase.rpc('get_my_invitations')

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
        <TeamSection
          currentUserId={user.id}
          team={(team as Team | null) ?? null}
          invitations={(myInvitations as MyInvitations | null) ?? { incoming: [], outgoing: [] }}
        />
      </main>
    </div>
  )
}
