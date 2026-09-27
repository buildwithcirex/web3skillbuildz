'use client'

import { useState } from 'react'
import { Send, EyeOff } from 'lucide-react'
import { toggleScoresPublished } from '@/app/actions/project'

export default function PublishScoresToggle({ isPublished }: { isPublished: boolean }) {
  const [loading, setLoading] = useState(false)

  const handleToggle = async () => {
    const confirmMessage = isPublished
      ? 'Are you sure you want to unpublish scores? Participants will no longer be able to see their scores.'
      : 'Are you sure you want to publish scores? All participants will now be able to view their scores and feedback.'

    if (!confirm(confirmMessage)) {
      return
    }

    setLoading(true)
    const result = await toggleScoresPublished(!isPublished)
    setLoading(false)

    if (result?.error) {
      alert('Error updating score publication: ' + result.error)
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold font-mono uppercase transition shadow-[2px_2px_0px_0px_#1c1917] active:shadow-none active:translate-y-[2px] active:translate-x-[2px] disabled:opacity-50 disabled:shadow-none disabled:translate-y-[2px] disabled:translate-x-[2px] border-2 border-stone-900 ${
        isPublished
          ? 'bg-purple-300 text-stone-900 hover:bg-purple-200'
          : 'bg-indigo-400 text-stone-900 hover:bg-indigo-300'
      }`}
    >
      {isPublished ? (
        <>
          <EyeOff className="w-4 h-4 text-stone-900" />
          <span>{loading ? 'Updating...' : 'Scores Published (Live)'}</span>
        </>
      ) : (
        <>
          <Send className="w-4 h-4 text-stone-900" />
          <span>{loading ? 'Publishing...' : 'Publish Scores to Participants'}</span>
        </>
      )}
    </button>
  )
}
