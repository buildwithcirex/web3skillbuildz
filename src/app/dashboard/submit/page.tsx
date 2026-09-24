import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { signOut } from '@/app/actions/auth'
import DashboardNav from '../_components/DashboardNav'
import ParticipantSubmissionSection from '../_components/ParticipantSubmissionSection'
import type { Profile } from '@/lib/types'

export default async function SubmitPage() {
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

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav profileName={profile.name} activeTab="submission" />

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Submission</h2>
          <p className="text-sm text-gray-500 mt-1">Upload your project details, deploy link, and screenshot.</p>
        </div>

        <ParticipantSubmissionSection
          profile={profile}
          isLocked={isLocked}
          isScoresPublished={isScoresPublished}
        />
      </main>
    </div>
  )
}
