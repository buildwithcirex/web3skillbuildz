'use client'

import { useState } from 'react'
import { Lock, Unlock } from 'lucide-react'
import { toggleSubmissionsLock } from '@/app/actions/project'

export default function LockSubmissionsToggle({ isLocked }: { isLocked: boolean }) {
  const [loading, setLoading] = useState(false)

  const handleToggle = async () => {
    const action = isLocked ? 'unlock and allow' : 'lock and prevent'
    if (!confirm(`Are you sure you want to ${action} project submissions for all participants?`)) {
      return
    }

    setLoading(true)
    const result = await toggleSubmissionsLock(!isLocked)
    setLoading(false)

    if (result?.error) {
      alert('Error updating lock status: ' + result.error)
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
          <span>{loading ? 'Updating...' : 'Submissions Locked'}</span>
        </>
      ) : (
        <>
          <Unlock className="w-4 h-4 text-stone-900" />
          <span>{loading ? 'Updating...' : 'Submissions Open'}</span>
        </>
      )}
    </button>
  )
}
