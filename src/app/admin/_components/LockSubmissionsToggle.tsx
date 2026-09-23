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
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs disabled:opacity-50 ${
        isLocked
          ? 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
          : 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
      }`}
    >
      {isLocked ? (
        <>
          <Lock className="w-4 h-4 text-red-600" />
          <span>{loading ? 'Updating…' : 'Submissions Locked'}</span>
        </>
      ) : (
        <>
          <Unlock className="w-4 h-4 text-green-600" />
          <span>{loading ? 'Updating…' : 'Submissions Open'}</span>
        </>
      )}
    </button>
  )
}
