import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { signOut } from '@/app/actions/auth'
import ParticipantsTable from './_components/ParticipantsTable'
import LockSubmissionsToggle from './_components/LockSubmissionsToggle'
import PublishScoresToggle from './_components/PublishScoresToggle'
import type { Profile } from '@/lib/types'

export default async function AdminPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('role, name')
    .eq('id', user.id)
    .single()

  // Role-based guard: only admins allowed
  if (!adminProfile || adminProfile.role !== 'admin') redirect('/dashboard')

  // Fetch lock status and scores published status
  const { data: config } = await supabase
    .from('event_config')
    .select('submissions_locked, scores_published')
    .eq('id', 1)
    .maybeSingle()

  const isLocked = Boolean(config?.submissions_locked)
  const isScoresPublished = Boolean(config?.scores_published)

  const { data: participants, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  const allProfiles = (participants as Profile[]) ?? []
  const totalSubmissions = allProfiles.filter(p => p.project_description).length
  const totalReviewed = allProfiles.filter(p => p.score !== null && p.score !== undefined).length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <span className="font-bold text-gray-900">SkillBuildz</span>
              <span className="ml-2 text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded">
                Admin
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 hidden sm:block">
              Organizer: <span className="font-semibold text-gray-900">{adminProfile.name}</span>
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

      <main className="max-w-7xl mx-auto px-6 py-10 space-y-8">
        {/* Title + Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Event Controls & Participants</h2>
            <p className="text-sm text-gray-500 mt-1">
              Control submission window, review projects, assign scores, and publish results to participants.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <LockSubmissionsToggle isLocked={isLocked} />
            <PublishScoresToggle isPublished={isScoresPublished} />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Total Participants</p>
            <p className="text-3xl font-bold text-gray-900">{allProfiles.length}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Projects Submitted</p>
            <p className="text-3xl font-bold text-indigo-600">{totalSubmissions}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Reviewed & Scored</p>
            <p className="text-3xl font-bold text-purple-600">{totalReviewed}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Results Visibility</p>
            <div className="mt-1">
              {isScoresPublished ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">
                  ✅ Scores Live to Users
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700">
                  🔒 Scores Hidden from Users
                </span>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            Error loading participants: {error.message}
          </div>
        )}

        {/* Table */}
        <ParticipantsTable profiles={allProfiles} />
      </main>
    </div>
  )
}
