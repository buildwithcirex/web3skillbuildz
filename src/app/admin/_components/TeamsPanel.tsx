'use client'

import { useState } from 'react'
import { Award, Lock, Unlock, Crown } from 'lucide-react'
import type { AdminTeamSummary } from '@/lib/team/types'
import { unlockTeam } from '@/app/actions/project'
import TeamScoreModal from './TeamScoreModal'

export default function TeamsPanel({ teams }: { teams: AdminTeamSummary[] }) {
  const [reviewTarget, setReviewTarget] = useState<AdminTeamSummary | null>(null)
  const [loading, setLoading] = useState(false)

  const handleUnlock = async (teamId: string) => {
    if (!confirm('Unlock this team? Membership becomes editable again; its existing score/submission stay as-is.')) {
      return
    }
    setLoading(true)
    const result = await unlockTeam(teamId)
    setLoading(false)
    if (result?.error) alert('Error: ' + result.error)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-white">
        <h3 className="text-sm font-bold text-gray-900">Teams</h3>
        <p className="text-xs text-gray-500 mt-0.5">Review submissions and assign a score per team.</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Team</th>
              <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Members</th>
              <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Lock</th>
              <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Submission</th>
              <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Score</th>
              <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {teams.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center text-sm text-gray-400 py-12">
                  No teams yet.
                </td>
              </tr>
            ) : (
              teams.map(team => (
                <tr key={team.id} className="hover:bg-gray-50/50 transition">
                  <td className="px-5 py-4">
                    <p className="text-sm font-medium text-gray-900">{team.name}</p>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-1.5">
                      {team.members.map(m => (
                        <span
                          key={m.id}
                          className="inline-flex items-center gap-1 text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full"
                        >
                          {m.role === 'leader' && <Crown className="w-3 h-3 text-amber-600" />}
                          {m.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    {team.isLocked ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                        <Lock className="w-3 h-3" /> Locked
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                        <Unlock className="w-3 h-3" /> Open
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    {team.projectDescription ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                        ✓ Submitted
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full">
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    {team.score !== null && team.score !== undefined ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-lg">
                        <Award className="w-3 h-3 text-amber-500" />
                        {team.score}/100
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400 font-medium">—</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {team.isLocked && (
                        <button
                          onClick={() => handleUnlock(team.id)}
                          disabled={loading}
                          title="Unlock Team"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-xs font-semibold transition"
                        >
                          <Unlock className="w-3.5 h-3.5" />
                          <span>Unlock</span>
                        </button>
                      )}
                      <button
                        onClick={() => setReviewTarget(team)}
                        title="Review & Score"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-xs font-semibold transition"
                      >
                        <Award className="w-3.5 h-3.5 text-purple-600" />
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
