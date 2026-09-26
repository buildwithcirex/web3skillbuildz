'use client'

import { useState } from 'react'
import { Users } from 'lucide-react'
import { createTeam } from '@/app/actions/team'
import { MAX_TEAM_SIZE } from '@/lib/team/constants'

export default function CreateTeamPrompt() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreate = async () => {
    setLoading(true)
    setError(null)
    const result = await createTeam()
    setLoading(false)
    if (result?.error) setError(result.error)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex flex-col items-center text-center gap-3 py-4">
        <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center">
          <Users className="w-6 h-6 text-indigo-600" />
        </div>
        <h3 className="text-lg font-bold text-gray-900">Build Your Team</h3>
        <p className="text-sm text-gray-500 max-w-sm">
          Create a team of up to {MAX_TEAM_SIZE} people. The person who sends an invite that gets accepted first will become the team leader.
        </p>
        {error && (
          <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3 w-full">
            {error}
          </p>
        )}
        <button
          onClick={handleCreate}
          disabled={loading}
          className="mt-1 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition shadow-xs"
        >
          {loading ? 'Creating…' : 'Create a Team'}
        </button>
      </div>
    </div>
  )
}
