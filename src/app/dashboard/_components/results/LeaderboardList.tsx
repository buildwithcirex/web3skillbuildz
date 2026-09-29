import type { CSSProperties } from 'react'
import { MAX_SCORE, type LeaderboardTeam } from '@/lib/team/types'
import Mascot, { SLOT_MASCOTS } from './Mascot'
import { PODIUM_REVEAL_SECONDS } from './Podium'
import UserAvatar from '@/app/_components/UserAvatar'

interface RankedEntry {
  team: LeaderboardTeam
  rank: number
}

const ROW_TINTS: Record<number, string> = {
  1: 'bg-amber-100',
  2: 'bg-stone-100',
  3: 'bg-orange-100',
}

export default function LeaderboardList({
  ranked,
  podiumTeamIds,
  unscored,
}: {
  ranked: RankedEntry[]
  podiumTeamIds: string[]
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
              ranked.map(({ team, rank }, i) => {
                const slot = podiumTeamIds.indexOf(team.id)
                return (
                <tr
                  key={team.id}
                  className={`leaderboard-row hover:bg-amber-100 transition border-b-2 border-stone-900 ${slot === -1 ? 'bg-white' : ROW_TINTS[rank] ?? 'bg-white'}`}
                  // Rows cascade in once the podium reveal has finished.
                  style={{ '--d': `${PODIUM_REVEAL_SECONDS + Math.min(i, 12) * 0.06}s` } as CSSProperties}
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold font-mono text-stone-900">#{rank}</span>
                      {slot !== -1 && <Mascot kind={SLOT_MASCOTS[slot]} className="w-7 h-7 shrink-0" />}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-sm font-bold font-mono uppercase text-stone-900">{team.name}</p>
                    <p className="text-[10px] font-bold font-mono uppercase text-stone-500 sm:hidden mt-1">{team.members.map(m => m.name).join(', ')}</p>
                  </td>
                  <td className="px-5 py-4 hidden sm:table-cell">
                    <div className="flex items-center gap-3">
                      <div className="flex -space-x-2">
                        {team.members.map(m => (
                          <UserAvatar key={m.id} userId={m.id} name={m.name} size={28} />
                        ))}
                      </div>
                      <p className="text-sm font-mono font-semibold text-stone-700">{team.members.map(m => m.name).join(', ')}</p>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <span className="text-sm font-bold font-mono text-stone-900">{team.score}/{MAX_SCORE}</span>
                  </td>
                </tr>
                )
              })
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
