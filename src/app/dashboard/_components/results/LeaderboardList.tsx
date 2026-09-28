import type { LeaderboardTeam } from '@/lib/team/types'

interface RankedEntry {
  team: LeaderboardTeam
  rank: number
}

export default function LeaderboardList({
  ranked,
  unscored,
}: {
  ranked: RankedEntry[]
  unscored: LeaderboardTeam[]
}) {
  return (
    <div className="bg-white border-4 border-stone-900 shadow-[8px_8px_0px_0px_#1c1917] overflow-hidden">
      <div className="p-5 border-b-4 border-stone-900 bg-amber-400">
        <h3 className="text-lg font-bold font-mono text-stone-900 uppercase">Full Leaderboard</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-stone-300 border-b-4 border-stone-900">
            <tr>
              <th className="text-left text-xs font-bold font-mono text-stone-900 uppercase tracking-widest px-5 py-3">Rank</th>
              <th className="text-left text-xs font-bold font-mono text-stone-900 uppercase tracking-widest px-5 py-3">Team</th>
              <th className="text-left text-xs font-bold font-mono text-stone-900 uppercase tracking-widest px-5 py-3 hidden sm:table-cell">Members</th>
              <th className="text-right text-xs font-bold font-mono text-stone-900 uppercase tracking-widest px-5 py-3">Score</th>
            </tr>
          </thead>
          <tbody>
            {ranked.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center text-sm font-bold font-mono uppercase text-stone-500 py-12">
                  No scored teams yet.
                </td>
              </tr>
            ) : (
              ranked.map(({ team, rank }) => (
                <tr key={team.id} className="hover:bg-amber-100 transition border-b-2 border-stone-900 bg-white">
                  <td className="px-5 py-4">
                    <span className="text-sm font-bold font-mono text-stone-900">#{rank}</span>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-sm font-bold font-mono uppercase text-stone-900">{team.name}</p>
                    <p className="text-[10px] font-bold font-mono uppercase text-stone-500 sm:hidden mt-1">{team.members.map(m => m.name).join(', ')}</p>
                  </td>
                  <td className="px-5 py-4 hidden sm:table-cell">
                    <p className="text-sm font-mono font-semibold text-stone-700">{team.members.map(m => m.name).join(', ')}</p>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <span className="text-sm font-bold font-mono text-stone-900">{team.score}/100</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {unscored.length > 0 && (
        <div className="p-5 border-t-4 border-stone-900 bg-stone-200">
          <p className="text-xs font-bold font-mono text-stone-900 uppercase tracking-widest mb-3">Not Yet Scored</p>
          <div className="flex flex-wrap gap-2">
            {unscored.map(team => (
              <span key={team.id} className="text-[10px] font-bold font-mono uppercase text-stone-900 bg-white border-2 border-stone-900 px-2.5 py-1">
                {team.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
