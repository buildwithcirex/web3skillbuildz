'use client'

import { useState } from 'react'
import { Users } from 'lucide-react'
import { createTeam } from '@/app/actions/team'
import { MAX_TEAM_SIZE } from '@/lib/team/constants'

export default function CreateTeamPrompt() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [teamName, setTeamName] = useState('')

  const handleCreate = async () => {
    setLoading(true)
    setError(null)
    const result = await createTeam(teamName.trim() || undefined)
    setLoading(false)
    if (result?.error) setError(result.error)
  }

  return (
    <div className="bg-white rounded-none border-2 border-stone-900 p-6 relative max-w-lg mx-auto">
      {/* Decorative corners */}
      <div className="absolute top-0 left-0 w-2 h-2 bg-stone-900" />
      <div className="absolute top-0 right-0 w-2 h-2 bg-stone-900" />
      <div className="absolute bottom-0 left-0 w-2 h-2 bg-stone-900" />
      <div className="absolute bottom-0 right-0 w-2 h-2 bg-stone-900" />
      
      <div className="flex flex-col items-center text-center gap-4 py-4">
        <div className="w-12 h-12 bg-amber-400 border-2 border-stone-900 flex items-center justify-center">
          <Users className="w-6 h-6 text-stone-900" />
        </div>
        <h3 className="text-lg font-bold font-mono uppercase text-stone-900">Build Your Team</h3>
        <p className="text-sm font-medium text-stone-600 max-w-sm">
          Create a team of up to {MAX_TEAM_SIZE} people. The person who sends an invite that gets accepted first will become the team leader.
        </p>

        <div className="w-full flex flex-col items-start mt-2">
          <label htmlFor="teamName" className="text-xs font-bold font-mono text-stone-900 uppercase tracking-widest mb-2">
            Team Name (Optional)
          </label>
          <input
            id="teamName"
            type="text"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder="e.g. Cyber Punks"
            className="w-full bg-stone-100 border-2 border-stone-900 px-4 py-2 text-sm font-mono text-stone-900 focus:outline-none focus:bg-white transition"
          />
        </div>

        {error && (
          <p className="text-sm font-bold font-mono uppercase text-red-900 bg-red-100 border-2 border-red-900 px-4 py-3 w-full">
            ERR: {error}
          </p>
        )}
        <button
          onClick={handleCreate}
          disabled={loading}
          className="mt-2 w-full px-6 py-3 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-stone-900 border-2 border-stone-900 text-sm font-bold font-mono uppercase transition shadow-[4px_4px_0px_0px_#1c1917] active:shadow-none active:translate-y-[4px] active:translate-x-[4px]"
        >
          {loading ? 'Initializing...' : 'Create Team'}
        </button>
      </div>
    </div>
  )
}
