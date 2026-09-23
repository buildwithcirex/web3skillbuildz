import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { signOut } from '@/app/actions/auth'
import ParticipantSubmissionSection from './_components/ParticipantSubmissionSection'
import type { Profile } from '@/lib/types'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  // Try to fetch existing profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle<Profile>()

  if (profileError) {
    console.error('Error fetching profile:', profileError)
  }

  // If profile still missing, show friendly error with details
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

  // Role guard — admins go to /admin
  if (profile.role === 'admin') redirect('/admin')

  // Check event submissions lock status & scores published status
  const { data: config } = await supabase
    .from('event_config')
    .select('submissions_locked, scores_published')
    .eq('id', 1)
    .maybeSingle()

  const isLocked = Boolean(config?.submissions_locked)
  const isScoresPublished = Boolean(config?.scores_published)
  const hasSubmitted = !!(profile.project_description && profile.deploy_link && profile.screenshot_url)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <span className="font-bold text-gray-900">SkillBuildz</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500 hidden sm:block">
              Welcome, <span className="font-medium text-gray-900">{profile.name}</span>
            </span>
            <form action={signOut}>
              <button
                type="submit"
                className="text-sm font-medium text-gray-600 hover:text-red-600 transition px-3 py-1.5 rounded-lg hover:bg-red-50"
              >
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-6 py-10 space-y-8">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-gray-900">My Dashboard</h2>
          {hasSubmitted ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
              ✓ Submitted
            </span>
          ) : isLocked ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
              🔒 Submissions Closed
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
              Pending Submission
            </span>
          )}
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

        {/* Submission Section */}
        <ParticipantSubmissionSection
          profile={profile}
          isLocked={isLocked}
          isScoresPublished={isScoresPublished}
        />
      </main>
    </div>
  )
}
