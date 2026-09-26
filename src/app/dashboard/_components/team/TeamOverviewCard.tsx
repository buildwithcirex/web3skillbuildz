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
    <div className="bg-white rounded-none border-2 border-stone-900 p-6 space-y-4 relative">
      {/* Decorative corners */}
      <div className="absolute top-0 left-0 w-2 h-2 bg-stone-900" />
      <div className="absolute top-0 right-0 w-2 h-2 bg-stone-900" />
      <div className="absolute bottom-0 left-0 w-2 h-2 bg-stone-900" />
      <div className="absolute bottom-0 right-0 w-2 h-2 bg-stone-900" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 bg-amber-400 border-2 border-stone-900 flex items-center justify-center">
            <Users className="w-5 h-5 text-stone-900" />
          </div>
          <div>
            <h3 className="text-sm font-bold font-mono text-stone-900 uppercase">{team.name}</h3>
            <p className="text-xs font-mono font-bold text-stone-500 uppercase tracking-widest">Your Team</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {team.isLocked ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold font-mono uppercase bg-red-400 text-stone-900 border-2 border-stone-900">
              <Lock className="w-3.5 h-3.5" /> Locked
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold font-mono uppercase bg-green-400 text-stone-900 border-2 border-stone-900">
              <Unlock className="w-3.5 h-3.5" /> Open
            </span>
          )}
          <span className="inline-flex items-center px-3 py-1.5 text-xs font-bold font-mono uppercase bg-stone-200 text-stone-900 border-2 border-stone-900">
            {team.members.length}/{team.capacity} members
          </span>
        </div>
      </div>

      <ul className="divide-y-2 divide-stone-200 border-t-2 border-b-2 border-stone-200">
        {team.members.map(member => (
          <li key={member.id} className="flex flex-col sm:flex-row sm:items-center justify-between py-4 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-stone-900 border-2 border-stone-900 flex items-center justify-center text-sm font-bold font-mono text-amber-400 uppercase">
                {member.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-bold font-mono text-stone-900 uppercase flex items-center gap-2 flex-wrap">
                  {member.name}
                  {member.role === 'leader' && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-900 bg-amber-400 border-2 border-stone-900 px-2 py-0.5">
                      <Crown className="w-3 h-3" /> Leader
                    </span>
                  )}
                </p>
                <p className="text-xs font-mono font-medium text-stone-500 break-all">{member.email}</p>
              </div>
            </div>
            {team.isLeader && !team.isLocked && member.id !== currentUserId && (
              <button
                onClick={() => {
                  setRemoveTarget(member)
                  setError(null)
                }}
                title="Remove from team"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-red-400 hover:bg-red-500 border-2 border-stone-900 text-stone-900 text-xs font-bold font-mono uppercase transition shadow-[2px_2px_0px_0px_#1c1917] active:shadow-none active:translate-y-[2px] active:translate-x-[2px]"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove</span>
              </button>
            )}
          </li>
        ))}
      </ul>

      {team.isLeader && !team.isLocked && (
        <div className="pt-4 space-y-3">
          <p className="text-xs font-bold font-mono text-stone-500 uppercase">
            Locking your team freezes its membership and is required before you can submit a project.
          </p>
          {lockError && (
            <p className="text-sm font-bold font-mono text-red-900 bg-red-100 border-2 border-red-900 px-3 py-2 uppercase">{lockError}</p>
          )}
          <button
            onClick={handleLock}
            disabled={locking || leaving}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-400 hover:bg-amber-500 disabled:opacity-50 text-stone-900 border-2 border-stone-900 text-xs font-bold font-mono uppercase transition shadow-[4px_4px_0px_0px_#1c1917] active:shadow-none active:translate-y-[4px] active:translate-x-[4px]"
          >
            <Lock className="w-4 h-4" />
            {locking ? 'Locking...' : 'Lock My Team'}
          </button>
        </div>
      )}

      {!team.isLocked && (
        <div className="pt-2">
          {leaveError && (
            <p className="text-sm font-bold font-mono text-red-900 bg-red-100 border-2 border-red-900 px-3 py-2 mb-3 uppercase">{leaveError}</p>
          )}
          <button
            onClick={handleLeave}
            disabled={leaving || locking}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-red-400 hover:bg-red-500 border-2 border-stone-900 text-stone-900 disabled:opacity-50 text-xs font-bold font-mono uppercase transition shadow-[4px_4px_0px_0px_#1c1917] active:shadow-none active:translate-y-[4px] active:translate-x-[4px]"
          >
            <LogOut className="w-4 h-4" />
            {leaving ? 'Leaving...' : team.isLeader ? 'Disband Team' : 'Leave Team'}
          </button>
        </div>
      )}

      {removeTarget && (
        <div className="fixed inset-0 bg-stone-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border-4 border-stone-900 w-full max-w-sm p-6 relative">
            {/* Decorative corners */}
            <div className="absolute top-0 left-0 w-2 h-2 bg-stone-900" />
            <div className="absolute top-0 right-0 w-2 h-2 bg-stone-900" />
            <div className="absolute bottom-0 left-0 w-2 h-2 bg-stone-900" />
            <div className="absolute bottom-0 right-0 w-2 h-2 bg-stone-900" />
            
            <div className="flex flex-col items-center text-center gap-3 mb-6">
              <div className="w-12 h-12 bg-red-400 border-2 border-stone-900 flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-stone-900" />
              </div>
              <h3 className="text-lg font-bold font-mono uppercase text-stone-900">Remove Member?</h3>
              <p className="text-sm font-medium text-stone-600">
                <span className="font-bold text-stone-900">{removeTarget.name}</span> will be removed from
                the team and will be free to join or create another team.
              </p>
            </div>
            {error && (
              <p className="text-sm font-bold font-mono uppercase text-red-900 bg-red-100 border-2 border-red-900 px-3 py-2 mb-4">
                ERR: {error}
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setRemoveTarget(null)}
                className="flex-1 py-2.5 border-2 border-stone-900 bg-stone-200 hover:bg-stone-300 text-stone-900 text-sm font-bold font-mono uppercase transition shadow-[4px_4px_0px_0px_#1c1917] active:shadow-none active:translate-y-[4px] active:translate-x-[4px]"
              >
                Cancel
              </button>
              <button
                onClick={handleRemove}
                disabled={loading}
                className="flex-1 py-2.5 border-2 border-stone-900 bg-red-500 hover:bg-red-400 disabled:opacity-50 text-stone-900 text-sm font-bold font-mono uppercase transition shadow-[4px_4px_0px_0px_#1c1917] active:shadow-none active:translate-y-[4px] active:translate-x-[4px]"
              >
                {loading ? 'Removing...' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
