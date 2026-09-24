import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardNav from '../_components/DashboardNav'
import Podium from '../_components/results/Podium'
import LeaderboardList from '../_components/results/LeaderboardList'
import { Trophy } from 'lucide-react'
import type { LeaderboardResponse, LeaderboardTeam } from '@/lib/team/types'

export default async function ResultsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, role')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile) redirect('/')
  if (profile.role === 'admin') redirect('/admin')

  const { data: leaderboard } = await supabase.rpc('get_leaderboard')
  const result = (leaderboard as LeaderboardResponse | null) ?? { published: false, teams: [] }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav profileName={profile.name} activeTab="result" />

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Results</h2>
          <p className="text-sm text-gray-500 mt-1">See how every team ranked.</p>
        </div>

        {!result.published ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center space-y-3">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
              <Trophy className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Results aren&apos;t published yet</h3>
            <p className="text-sm text-gray-600 max-w-md mx-auto">
              The organizers are still reviewing submissions. Check back once results are announced.
            </p>
          </div>
        ) : (
          <ResultsContent teams={result.teams} />
        )}
      </main>
    </div>
  )
}

function ResultsContent({ teams }: { teams: LeaderboardTeam[] }) {
  const scored = teams.filter(t => t.score !== null && t.score !== undefined)
  const unscored = teams.filter(t => t.score === null || t.score === undefined)

  // Standard competition ranking: rank = 1 + count of strictly-greater scores, ties share a rank.
  const ranked = scored
    .slice()
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .map(team => ({
      team,
      rank: 1 + scored.filter(t => (t.score ?? 0) > (team.score ?? 0)).length,
    }))

  const top3 = ranked.filter(entry => entry.rank <= 3)
  const rest = ranked.filter(entry => entry.rank > 3)

  if (scored.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center space-y-3">
        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
          <Trophy className="w-6 h-6 text-gray-400" />
        </div>
        <h3 className="text-lg font-bold text-gray-900">No scores yet</h3>
        <p className="text-sm text-gray-600 max-w-md mx-auto">
          Scores have been published, but no team has been scored yet.
        </p>
      </div>
    )
  }

  return (
    <>
      <Podium entries={top3} />
      <LeaderboardList ranked={rest} unscored={unscored} />
    </>
  )
}
