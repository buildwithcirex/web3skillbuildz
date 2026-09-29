import type { CSSProperties } from 'react'
import { MAX_SCORE, type LeaderboardTeam } from '@/lib/team/types'
import Mascot, { SLOT_MASCOTS } from './Mascot'

interface PodiumEntry {
  team: LeaderboardTeam
  rank: number
}

// Block colour/height follow the rank so tied teams stand at the same height.
const RANK_STYLES: Record<number, { block: string; height: string }> = {
  1: { block: 'bg-amber-400', height: 'h-44 sm:h-60' },
  2: { block: 'bg-stone-300', height: 'h-36 sm:h-48' },
  3: { block: 'bg-orange-400', height: 'h-28 sm:h-40' },
}

// Slot 0 is the centre spot, 1 the left, 2 the right.
// The reveal runs 3rd → 2nd → 1st over ~10s; the winner's block rises slowest for suspense.
const SLOT_LAYOUT = [
  { col: 'col-start-2', start: 7.2, rise: 1.4 },
  { col: 'col-start-1', start: 3.9, rise: 0.9 },
  { col: 'col-start-3', start: 0.8, rise: 0.9 },
]

const revealTimes = ({ start, rise }: { start: number; rise: number }) => {
  const mascot = start + rise + 0.1
  return { block: start, rankNumber: start + rise * 0.7, mascot, idle: mascot + 0.85, stamp: mascot + 0.8 }
}

const WINNER_REVEAL = revealTimes(SLOT_LAYOUT[0]).stamp

// When the whole podium has landed; the leaderboard below starts cascading in after this.
export const PODIUM_REVEAL_SECONDS = WINNER_REVEAL + 0.7

const CONFETTI_COLORS = ['#fbbf24', '#f97316', '#1c1917', '#d6d3d1', '#fb923c', '#fde047']
const CONFETTI = Array.from({ length: 28 }, (_, i) => ({
  left: `${(i * 37 + 7) % 100}%`,
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  delay: `${WINNER_REVEAL + ((i * 0.23) % 2.4)}s`,
  duration: `${3.2 + ((i * 0.41) % 2)}s`,
  size: i % 3 === 0 ? 10 : 7,
}))

const ORDINALS: Record<number, string> = { 1: '1st', 2: '2nd', 3: '3rd' }

const timing = (delay: number, length?: number) =>
  ({ '--d': `${delay}s`, ...(length !== undefined && { '--len': `${length}s` }) }) as CSSProperties

export default function Podium({ entries }: { entries: PodiumEntry[] }) {
  if (entries.length === 0) return null

  const podium = entries.slice(0, 3)
  const winner = podium[0]

  // Announcer lines, in reveal order (3rd first). Each hands over to the next.
  const steps = podium
    .map((entry, slot) => ({ slot, text: slot === 0 ? 'And the winner is…' : `${ORDINALS[entry.rank] ?? `${entry.rank}th`} place…` }))
    .reverse()
  const captions = steps.map((step, i) => {
    const from = SLOT_LAYOUT[step.slot].start - 0.5
    const to = i + 1 < steps.length ? SLOT_LAYOUT[steps[i + 1].slot].start - 0.6 : WINNER_REVEAL - 0.1
    return { key: step.slot, text: step.text, from, length: to - from, drumroll: step.slot === 0 }
  })

  return (
    <section
      aria-label="Top 3 teams"
      className="podium-stage relative overflow-hidden bg-white border-4 border-stone-900 shadow-[8px_8px_0px_0px_#1c1917]"
    >
      <div className="relative z-10 p-5 border-b-4 border-stone-900 bg-stone-900">
        <h3 className="text-lg font-bold font-mono text-amber-400 uppercase tracking-tight">Winners&apos; Podium</h3>
      </div>

      <div className="relative z-10 h-12 border-b-4 border-stone-900 bg-amber-100 overflow-hidden">
        {captions.map(c => (
          <p
            key={c.key}
            aria-hidden
            className={`podium-caption ${c.drumroll ? 'podium-caption-drumroll' : ''} absolute inset-0 flex items-center justify-center text-sm sm:text-base font-black font-mono uppercase tracking-widest text-stone-900`}
            style={timing(c.from, c.length)}
          >
            {c.text}
          </p>
        ))}
        <p
          className="podium-caption-final absolute inset-0 flex items-center justify-center px-4 text-sm sm:text-base font-black font-mono uppercase tracking-widest text-stone-900 truncate"
          style={timing(WINNER_REVEAL)}
        >
          🏆 Congrats, {winner.team.name}!
        </p>
      </div>

      <div aria-hidden className="pointer-events-none absolute inset-0 top-28">
        {CONFETTI.map((c, i) => (
          <span
            key={i}
            className="podium-confetti absolute top-0 border border-stone-900"
            style={{
              left: c.left,
              width: c.size,
              height: c.size * 1.6,
              backgroundColor: c.color,
              animationDelay: c.delay,
              animationDuration: c.duration,
            }}
          />
        ))}
      </div>

      <div className="relative grid grid-cols-3 gap-3 sm:gap-6 items-end px-4 sm:px-10 pt-12">
        {podium.map(({ team, rank }, slot) => {
          const style = RANK_STYLES[rank] ?? RANK_STYLES[3]
          const layout = SLOT_LAYOUT[slot]
          const t = revealTimes(layout)
          const mascot = SLOT_MASCOTS[slot]
          const members = team.members.map(m => m.name).join(', ')

          return (
            <div key={team.id} className={`${layout.col} row-start-1 flex flex-col items-center min-w-0`}>
              <div className="relative w-20 sm:w-28 -mb-1 z-10">
                {slot === 0 && (
                  <div aria-hidden className="podium-rays absolute left-1/2 top-1/2 w-44 h-44 sm:w-56 sm:h-56 -z-10" style={timing(t.stamp)} />
                )}
                <div className="podium-mascot-drop" style={timing(t.mascot)}>
                  <div className={`podium-mascot-idle podium-idle-${mascot}`} style={timing(t.idle)}>
                    <Mascot kind={mascot} className="w-full h-auto" />
                  </div>
                </div>
              </div>

              <div
                className={`podium-block ${style.block} ${style.height} w-full border-4 border-b-0 border-stone-900 shadow-[4px_0px_0px_0px_#1c1917] flex flex-col items-center pt-3 px-2 text-center`}
                style={timing(t.block, layout.rise)}
              >
                <span
                  className="podium-block-content text-3xl sm:text-5xl font-black font-mono text-stone-900 leading-none"
                  style={timing(t.rankNumber)}
                >
                  {rank}
                </span>
                <div className="podium-stamp w-full flex flex-col items-center gap-1 mt-1 min-w-0" style={timing(t.stamp)}>
                  <p className="w-full text-[11px] sm:text-sm font-bold font-mono uppercase text-stone-900 truncate" title={team.name}>
                    {team.name}
                  </p>
                  <p className="text-[10px] sm:text-xs font-bold font-mono text-stone-900 bg-white border-2 border-stone-900 px-1.5 py-0.5">
                    {team.score}/{MAX_SCORE}
                  </p>
                  <p className="hidden sm:block w-full text-[10px] font-bold font-mono uppercase text-stone-800 truncate" title={members}>
                    {members}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      <div className="relative h-4 bg-stone-900" />
    </section>
  )
}
