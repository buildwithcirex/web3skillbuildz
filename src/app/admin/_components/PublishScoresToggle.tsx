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
      className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-xs disabled:opacity-50 ${
        isPublished
          ? 'bg-purple-100 text-purple-800 border border-purple-300 hover:bg-purple-200'
          : 'bg-indigo-600 text-white hover:bg-indigo-700'
      }`}
    >
      {isPublished ? (
        <>
          <EyeOff className="w-3.5 h-3.5 text-purple-700" />
          <span>{loading ? 'Updating…' : 'Scores Published (Live)'}</span>
        </>
      ) : (
        <>
          <Send className="w-3.5 h-3.5 text-white" />
          <span>{loading ? 'Publishing…' : 'Publish Scores to Participants'}</span>
        </>
      )}
    </button>
  )
}
