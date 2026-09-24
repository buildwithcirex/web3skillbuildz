import { Crown, Medal } from 'lucide-react'
import type { LeaderboardTeam } from '@/lib/team/types'

interface PodiumEntry {
  team: LeaderboardTeam
  rank: number
}

const PODIUM_STYLES: Record<number, { order: string; height: string; badge: string; icon: 'crown' | 'medal' }> = {
  1: { order: 'order-2', height: 'pt-0', badge: 'bg-amber-400 text-amber-950', icon: 'crown' },
  2: { order: 'order-1', height: 'pt-6', badge: 'bg-gray-300 text-gray-800', icon: 'medal' },
  3: { order: 'order-3', height: 'pt-10', badge: 'bg-orange-300 text-orange-900', icon: 'medal' },
}

export default function Podium({ entries }: { entries: PodiumEntry[] }) {
  if (entries.length === 0) return null

  return (
    <div className="grid grid-cols-3 gap-4 items-end mb-8">
      {entries.map(({ team, rank }) => {
        const style = PODIUM_STYLES[rank] ?? PODIUM_STYLES[3]
        return (
          <div key={team.id} className={`${style.order} ${style.height} flex flex-col items-center`}>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${style.badge}`}>
              {style.icon === 'crown' ? <Crown className="w-6 h-6" /> : <Medal className="w-6 h-6" />}
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm w-full p-4 text-center space-y-1">
              <p className="text-xs font-bold text-gray-400">#{rank}</p>
              <p className="text-sm font-bold text-gray-900 truncate" title={team.name}>{team.name}</p>
              <p className="text-2xl font-black text-indigo-700">{team.score}</p>
              <p className="text-[11px] text-gray-400 truncate" title={team.members.map(m => m.name).join(', ')}>
                {team.members.map(m => m.name).join(', ')}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
