'use client'

import { useState } from 'react'
import { Users, Lock } from 'lucide-react'
import { toggleTeamFormationLock } from '@/app/actions/project'

export default function TeamFormationLockToggle({ isLocked }: { isLocked: boolean }) {
  const [loading, setLoading] = useState(false)

  const handleToggle = async () => {
    const action = isLocked
      ? 'unlock team formation (already-locked teams stay locked; unlock them individually below)'
      : 'lock team formation for every team that hasn\'t self-locked yet'
    if (!confirm(`Are you sure you want to ${action}?`)) {
      return
    }

    setLoading(true)
    const result = await toggleTeamFormationLock(!isLocked)
    setLoading(false)

    if (result?.error) {
      alert('Error updating team formation lock: ' + result.error)
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs disabled:opacity-50 ${
        isLocked
          ? 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
          : 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
      }`}
    >
      {isLocked ? (
        <>
          <Lock className="w-4 h-4 text-red-600" />
          <span>{loading ? 'Updating…' : 'Team Formation Locked'}</span>
        </>
      ) : (
        <>
          <Users className="w-4 h-4 text-green-600" />
          <span>{loading ? 'Updating…' : 'Lock Team Formation'}</span>
        </>
      )}
    </button>
  )
}
