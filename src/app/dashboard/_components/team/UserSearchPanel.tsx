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
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
      <div>
        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-indigo-600" /> Invite Teammates
        </h3>
        <p className="text-xs text-gray-400 mt-0.5">Search participants and send a team invitation.</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search by name or email..."
          className="w-full pl-10 pr-10 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {error && <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>}

      <ul className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
        {loading ? (
          <li className="text-sm text-gray-400 text-center py-6">Searching…</li>
        ) : results.length === 0 ? (
          <li className="text-sm text-gray-400 text-center py-6">No participants found.</li>
        ) : (
          results.map(candidate => {
            const remainingMs = Math.max(0, (cooldownUntil[candidate.id] ?? 0) - nowTick)
            const onCooldown = remainingMs > 0 && candidate.status === 'available'

            return (
              <li key={candidate.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{candidate.name}</p>
                  <p className="text-xs text-gray-400 truncate">{candidate.email}</p>
                </div>

                {candidate.status === 'already_in_team' ? (
                  <Badge tone="green">Already in Team</Badge>
                ) : candidate.status === 'already_in_other_team' ? (
                  <Badge tone="gray">Already in Another Team</Badge>
                ) : candidate.status === 'request_sent' ? (
                  <Badge tone="indigo">Request Sent</Badge>
                ) : onCooldown ? (
                  <Badge tone="amber">Wait {Math.ceil(remainingMs / 1000)}s</Badge>
                ) : (
                  <button
                    onClick={() => handleInvite(candidate)}
                    disabled={sendingId === candidate.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-xs font-semibold transition whitespace-nowrap"
                  >
                    {sendingId === candidate.id ? 'Sending…' : 'Send Request'}
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
