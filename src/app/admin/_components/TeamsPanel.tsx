'use client'

import { useState } from 'react'
import { Award, Lock, Unlock, Crown } from 'lucide-react'
import type { AdminTeamSummary } from '@/lib/team/types'
import { unlockTeam } from '@/app/actions/project'
import TeamScoreModal from './TeamScoreModal'

export default function TeamsPanel({ teams }: { teams: AdminTeamSummary[] }) {
  const [reviewTarget, setReviewTarget] = useState<AdminTeamSummary | null>(null)
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const handleUnlock = async (teamId: string) => {
    if (!confirm('Unlock this team? Membership becomes editable again; its existing score/submission stay as-is.')) {
      return
    }
    setLoadingId(teamId)
    const result = await unlockTeam(teamId)
    setLoadingId(null)
    if (result?.error) alert('Error: ' + result.error)
  }

  return (
    <div className="bg-white border-2 border-stone-900 overflow-hidden relative">
      <div className="absolute top-0 left-0 w-2 h-2 bg-stone-900" />
      <div className="absolute top-0 right-0 w-2 h-2 bg-stone-900" />
      <div className="absolute bottom-0 left-0 w-2 h-2 bg-stone-900" />
      <div className="absolute bottom-0 right-0 w-2 h-2 bg-stone-900" />

      <div className="p-4 border-b-2 border-stone-900 bg-stone-100">
        <h3 className="text-sm font-bold font-mono uppercase text-stone-900">Teams</h3>
        <p className="text-xs font-mono font-bold text-stone-500 mt-1 uppercase">Review submissions and assign a score per team.</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-stone-200 border-b-2 border-stone-900">
            <tr>
              <th className="text-left text-xs font-bold font-mono uppercase text-stone-900 tracking-widest px-5 py-3">Team</th>
              <th className="text-left text-xs font-bold font-mono uppercase text-stone-900 tracking-widest px-5 py-3">Members</th>
              <th className="text-left text-xs font-bold font-mono uppercase text-stone-900 tracking-widest px-5 py-3">Lock</th>
              <th className="text-left text-xs font-bold font-mono uppercase text-stone-900 tracking-widest px-5 py-3">Submission</th>
              <th className="text-left text-xs font-bold font-mono uppercase text-stone-900 tracking-widest px-5 py-3">Score</th>
              <th className="text-right text-xs font-bold font-mono uppercase text-stone-900 tracking-widest px-5 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-stone-100">
            {teams.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center text-sm font-mono font-bold uppercase text-stone-500 py-12">
                  No teams yet.
                </td>
              </tr>
            ) : (
              teams.map(team => (
                <tr key={team.id} className="hover:bg-amber-50 transition border-b border-stone-200">
                  <td className="px-5 py-4">
                    <p className="text-sm font-bold font-mono uppercase text-stone-900">{team.name}</p>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-2">
                      {team.members.map(m => (
                        <span
                          key={m.id}
                          className="inline-flex items-center gap-1.5 px-2 py-1 bg-stone-200 text-stone-900 border-2 border-stone-900 text-[10px] font-bold font-mono uppercase"
                        >
                          {m.role === 'leader' && <Crown className="w-3.5 h-3.5 text-stone-900" />}
                          {m.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    {team.isLocked ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-amber-400 text-stone-900 border-2 border-stone-900 text-[10px] font-bold font-mono uppercase">
                        <Lock className="w-3 h-3" /> Locked
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-green-400 text-stone-900 border-2 border-stone-900 text-[10px] font-bold font-mono uppercase">
                        <Unlock className="w-3 h-3" /> Open
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    {team.projectDescription && team.deployLink && team.screenshotUrl ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-green-400 text-stone-900 border-2 border-stone-900 text-[10px] font-bold font-mono uppercase">
                        ✓ Submitted
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-amber-200 text-stone-900 border-2 border-stone-900 text-[10px] font-bold font-mono uppercase">
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    {team.score !== null && team.score !== undefined ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-400 text-stone-900 border-2 border-stone-900 text-[10px] font-bold font-mono uppercase">
                        <Award className="w-3.5 h-3.5 text-stone-900" />
                        {team.score}/100
                      </span>
                    ) : (
                      <span className="text-xs font-mono uppercase text-stone-500 font-bold">—</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {team.isLocked && (
                        <button
                          onClick={() => handleUnlock(team.id)}
                          disabled={loadingId === team.id}
                          title="Unlock Team"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 border-2 border-stone-900 text-stone-900 bg-amber-400 hover:bg-amber-300 text-[10px] font-bold font-mono uppercase transition shadow-[2px_2px_0px_0px_#1c1917] active:shadow-none active:translate-y-[2px] active:translate-x-[2px] disabled:opacity-50"
                        >
                          <Unlock className="w-3.5 h-3.5" />
                          <span>{loadingId === team.id ? 'Unlocking...' : 'Unlock'}</span>
                        </button>
                      )}
                      <button
                        onClick={() => setReviewTarget(team)}
                        title="Review & Score"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 border-2 border-stone-900 text-stone-900 bg-indigo-400 hover:bg-indigo-300 text-[10px] font-bold font-mono uppercase transition shadow-[2px_2px_0px_0px_#1c1917] active:shadow-none active:translate-y-[2px] active:translate-x-[2px]"
                      >
                        <Award className="w-3.5 h-3.5 text-stone-900" />
                        <span>Review</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {reviewTarget && (
        <TeamScoreModal team={reviewTarget} onClose={() => setReviewTarget(null)} />
      )}
    </div>
  )
}
