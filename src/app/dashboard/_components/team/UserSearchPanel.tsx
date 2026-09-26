'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Search, UserPlus, X } from 'lucide-react'
import { searchTeamCandidates, sendTeamInvitation } from '@/app/actions/team'
import { INVITE_COOLDOWN_SECONDS } from '@/lib/team/constants'
import type { TeamCandidate } from '@/lib/team/types'

function Badge({ tone, children }: { tone: 'green' | 'gray' | 'indigo' | 'amber'; children: React.ReactNode }) {
  const tones: Record<typeof tone, string> = {
    green: 'text-green-700 bg-green-100',
    gray: 'text-gray-600 bg-gray-100',
    indigo: 'text-indigo-700 bg-indigo-50 border border-indigo-200',
    amber: 'text-amber-700 bg-amber-100',
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${tones[tone]}`}>
      {children}
    </span>
  )
}

export default function UserSearchPanel() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<TeamCandidate[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sendingId, setSendingId] = useState<string | null>(null)
  const [cooldownUntil, setCooldownUntil] = useState<Record<string, number>>({})
  const [nowTick, setNowTick] = useState(() => Date.now())
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const runSearch = useCallback(async (q: string) => {
    setLoading(true)
    setError(null)
    const result = await searchTeamCandidates(q)
    setLoading(false)
    if (result.error) setError(result.error)
    else setResults(result.candidates as TeamCandidate[])
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      void runSearch(query)
    }, 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, runSearch])

  const handleInvite = async (candidate: TeamCandidate) => {
    setSendingId(candidate.id)
    setError(null)
    const result = await sendTeamInvitation(candidate.id)
    setSendingId(null)

    // Best-effort local cooldown for the countdown UI — the server remains
    // the authority and will reject a premature retry with a clear error.
    setCooldownUntil(prev => ({ ...prev, [candidate.id]: Date.now() + INVITE_COOLDOWN_SECONDS * 1000 }))

    if (result?.error) {
      setError(result.error)
      return
    }
    setResults(prev => prev.map(c => (c.id === candidate.id ? { ...c, status: 'request_sent' } : c)))
  }

  return (
    <div className="bg-white rounded-none border-2 border-stone-900 p-6 space-y-4 relative">
      {/* Decorative corners */}
      <div className="absolute top-0 left-0 w-2 h-2 bg-stone-900" />
      <div className="absolute top-0 right-0 w-2 h-2 bg-stone-900" />
      <div className="absolute bottom-0 left-0 w-2 h-2 bg-stone-900" />
      <div className="absolute bottom-0 right-0 w-2 h-2 bg-stone-900" />

      <div>
        <h3 className="text-sm font-bold font-mono text-stone-900 uppercase flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-stone-900" /> Invite Teammates
        </h3>
        <p className="text-xs font-mono font-bold text-stone-500 mt-1 uppercase">Search participants and send a team invitation.</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="SEARCH BY NAME OR EMAIL..."
          className="w-full pl-10 pr-10 py-3 text-sm font-mono font-bold uppercase text-stone-900 placeholder:text-stone-400 bg-white border-2 border-stone-900 rounded-none focus:outline-none focus:ring-0 focus:border-amber-400 transition"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-900 transition"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {error && <p className="text-sm font-bold font-mono uppercase text-red-900 bg-red-100 border-2 border-red-900 px-4 py-3">{error}</p>}

      <ul className="divide-y-2 divide-stone-100 max-h-80 overflow-y-auto">
        {loading ? (
          <li className="text-sm font-mono font-bold text-stone-400 uppercase text-center py-6">Searching...</li>
        ) : results.length === 0 ? (
          <li className="text-sm font-mono font-bold text-stone-400 uppercase text-center py-6">No participants found.</li>
        ) : (
          results.map(candidate => {
            const remainingMs = Math.max(0, (cooldownUntil[candidate.id] ?? 0) - nowTick)
            const onCooldown = remainingMs > 0 && candidate.status === 'available'

            return (
              <li key={candidate.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4">
                <div className="min-w-0">
                  <p className="text-sm font-bold font-mono uppercase text-stone-900 truncate">{candidate.name}</p>
                  <p className="text-xs font-mono font-medium text-stone-500 truncate">{candidate.email}</p>
                </div>

                {candidate.status === 'already_in_team' ? (
                  <Badge tone="green">Already in Team</Badge>
                ) : candidate.status === 'already_in_other_team' ? (
                  <Badge tone="gray">In Another Team</Badge>
                ) : candidate.status === 'request_sent' ? (
                  <Badge tone="amber">Request Sent</Badge>
                ) : onCooldown ? (
                  <Badge tone="amber">Wait {Math.ceil(remainingMs / 1000)}s</Badge>
                ) : (
                  <button
                    onClick={() => handleInvite(candidate)}
                    disabled={sendingId === candidate.id}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 text-stone-900 border-2 border-stone-900 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-xs font-bold font-mono uppercase transition shadow-[4px_4px_0px_0px_#1c1917] active:shadow-none active:translate-y-[4px] active:translate-x-[4px]"
                  >
                    {sendingId === candidate.id ? 'Sending...' : 'Send Request'}
                  </button>
                )}
              </li>
            )
          })
        )}
      </ul>
    </div>
  )
}
