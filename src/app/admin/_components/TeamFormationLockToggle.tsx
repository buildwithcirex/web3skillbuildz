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
      className={`inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold font-mono uppercase transition shadow-[2px_2px_0px_0px_#1c1917] active:shadow-none active:translate-y-[2px] active:translate-x-[2px] disabled:opacity-50 disabled:shadow-none disabled:translate-y-[2px] disabled:translate-x-[2px] border-2 border-stone-900 ${
        isLocked
          ? 'bg-red-400 text-stone-900 hover:bg-red-300'
          : 'bg-green-400 text-stone-900 hover:bg-green-300'
      }`}
    >
      {isLocked ? (
        <>
          <Lock className="w-4 h-4 text-stone-900" />
          <span>{loading ? 'Updating...' : 'Team Formation Locked'}</span>
        </>
      ) : (
        <>
          <Users className="w-4 h-4 text-stone-900" />
          <span>{loading ? 'Updating...' : 'Lock Team Formation'}</span>
        </>
      )}
    </button>
  )
}
