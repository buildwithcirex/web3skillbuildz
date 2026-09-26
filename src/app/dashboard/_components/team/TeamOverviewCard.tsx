'use client'

import { useState } from 'react'
import { Crown, Trash2, Users, Lock, Unlock, LogOut } from 'lucide-react'
import { removeTeamMember, lockTeam, leaveTeam } from '@/app/actions/team'
import type { Team, TeamMember } from '@/lib/team/types'

export default function TeamOverviewCard({ team, currentUserId }: { team: Team; currentUserId: string }) {
  const [removeTarget, setRemoveTarget] = useState<TeamMember | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [locking, setLocking] = useState(false)
  const [lockError, setLockError] = useState<string | null>(null)
  const [leaving, setLeaving] = useState(false)
  const [leaveError, setLeaveError] = useState<string | null>(null)

  const handleRemove = async () => {
    if (!removeTarget) return
    setLoading(true)
    setError(null)
    const result = await removeTeamMember(removeTarget.id)
    setLoading(false)
    if (result?.error) {
      setError(result.error)
    } else {
      setRemoveTarget(null)
    }
  }

  const handleLeave = async () => {
    if (!confirm(team.isLeader ? 'Are you sure you want to leave? Because you are the leader, this will disband the entire team for everyone.' : 'Are you sure you want to leave this team?')) {
      return
    }
    setLeaving(true)
    setLeaveError(null)
    const result = await leaveTeam()
    setLeaving(false)
    if (result?.error) setLeaveError(result.error)
  }

  const handleLock = async () => {
    if (!confirm('Lock your team? This freezes membership — no one can be invited or removed afterward, and it unlocks submission.')) {
      return
    }
    setLocking(true)
    setLockError(null)
    const result = await lockTeam()
    setLocking(false)
    if (result?.error) setLockError(result.error)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
            <Users className="w-4.5 h-4.5 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">{team.name}</h3>
            <p className="text-xs text-gray-400">Your Team</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {team.isLocked ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
              <Lock className="w-3.5 h-3.5" /> Locked
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200">
              <Unlock className="w-3.5 h-3.5" /> Open
            </span>
          )}
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
            {team.members.length}/{team.capacity} members
          </span>
        </div>
      </div>

      <ul className="divide-y divide-gray-50">
        {team.members.map(member => (
          <li key={member.id} className="flex items-center justify-between py-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-xs font-semibold text-gray-600">
                {member.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                  {member.name}
                  {member.role === 'leader' && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full">
                      <Crown className="w-3 h-3" /> Leader
                    </span>
                  )}
                </p>
                <p className="text-xs text-gray-400">{member.email}</p>
              </div>
            </div>
            {team.isLeader && !team.isLocked && member.id !== currentUserId && (
              <button
                onClick={() => {
                  setRemoveTarget(member)
                  setError(null)
                }}
                title="Remove from team"
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 text-xs font-semibold transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove</span>
              </button>
            )}
          </li>
        ))}
      </ul>

      {team.isLeader && !team.isLocked && (
        <div className="pt-2 border-t border-gray-100 space-y-2">
          <p className="text-xs text-gray-500">
            Locking your team freezes its membership and is required before you can submit a project.
          </p>
          {lockError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{lockError}</p>
          )}
          <button
            onClick={handleLock}
            disabled={locking || leaving}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold transition shadow-xs"
          >
            <Lock className="w-3.5 h-3.5" />
            {locking ? 'Locking…' : 'Lock My Team'}
          </button>
        </div>
      )}

      {!team.isLocked && (
        <div className="pt-2 border-t border-gray-100 space-y-2">
          {leaveError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{leaveError}</p>
          )}
          <button
            onClick={handleLeave}
            disabled={leaving || locking}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 disabled:opacity-50 text-xs font-bold transition shadow-xs"
          >
            <LogOut className="w-3.5 h-3.5" />
            {leaving ? 'Leaving...' : team.isLeader ? 'Disband Team' : 'Leave Team'}
          </button>
        </div>
      )}

      {removeTarget && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex flex-col items-center text-center gap-3 mb-5">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Remove Team Member?</h3>
              <p className="text-sm text-gray-500">
                <span className="font-medium text-gray-900">{removeTarget.name}</span> will be removed from
                the team and will be free to join or create another team.
              </p>
            </div>
            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
                {error}
              </p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setRemoveTarget(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleRemove}
                disabled={loading}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition"
              >
                {loading ? 'Removing…' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
