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
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-sm font-bold text-gray-900">Full Leaderboard</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Rank</th>
              <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Team</th>
              <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3 hidden sm:table-cell">Members</th>
              <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {ranked.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center text-sm text-gray-400 py-8">
                  No scored teams yet.
                </td>
              </tr>
            ) : (
              ranked.map(({ team, rank }) => (
                <tr key={team.id} className="hover:bg-gray-50/50 transition">
                  <td className="px-5 py-3">
                    <span className="text-sm font-bold text-gray-700">#{rank}</span>
                  </td>
                  <td className="px-5 py-3">
                    <p className="text-sm font-medium text-gray-900">{team.name}</p>
                    <p className="text-xs text-gray-400 sm:hidden">{team.members.map(m => m.name).join(', ')}</p>
                  </td>
                  <td className="px-5 py-3 hidden sm:table-cell">
                    <p className="text-sm text-gray-600">{team.members.map(m => m.name).join(', ')}</p>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <span className="text-sm font-bold text-indigo-700">{team.score}/100</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {unscored.length > 0 && (
        <div className="p-4 border-t border-gray-100 bg-gray-50/50">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Not Yet Scored</p>
          <div className="flex flex-wrap gap-2">
            {unscored.map(team => (
              <span key={team.id} className="text-xs text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full">
                {team.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
