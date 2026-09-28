// Preview of the results podium with mock data. Not linked from the app.
import Podium from '../dashboard/_components/results/Podium'
import LeaderboardList from '../dashboard/_components/results/LeaderboardList'
import type { LeaderboardTeam } from '@/lib/team/types'

const mk = (id: string, name: string, score: number | null) =>
  ({ id, name, score, members: [{ id: `${id}-1`, name: 'Alice' }, { id: `${id}-2`, name: 'Bob' }] }) as unknown as LeaderboardTeam

export default function PodiumPreviewPage() {
  const teams = [
    mk('a', 'Block Busters', 94),
    mk('b', 'Gas Guzzlers', 88),
    mk('c', 'Hash Slingers', 81),
    mk('d', 'Node Ninjas', 75),
    mk('e', 'Merkle Mob', 70),
    mk('f', 'Zero Knowledge', null),
  ]
  const scored = teams.filter(t => t.score !== null)
  const ranked = scored
    .map(team => ({ team, rank: 1 + scored.filter(t => (t.score ?? 0) > (team.score ?? 0)).length }))
    .sort((a, b) => a.rank - b.rank)
  const podium = ranked.filter(entry => entry.rank <= 3).slice(0, 3)

  return (
    <main className="max-w-5xl mx-auto px-6 py-10 space-y-8 bg-stone-100 min-h-screen">
      <Podium entries={podium} />
      <LeaderboardList
        ranked={ranked}
        podiumTeamIds={podium.map(entry => entry.team.id)}
        unscored={teams.filter(t => t.score === null)}
      />
    </main>
  )
}
