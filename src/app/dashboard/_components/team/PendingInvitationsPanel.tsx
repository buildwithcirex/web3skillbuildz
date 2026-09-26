'use client'

import { useState } from 'react'
import { Check, Clock, Mail, X } from 'lucide-react'
import { acceptTeamInvitation, declineTeamInvitation } from '@/app/actions/team'
import type { IncomingInvitation, OutgoingInvitation } from '@/lib/team/types'

export default function PendingInvitationsPanel({
  incoming,
  outgoing,
}: {
  incoming: IncomingInvitation[]
  outgoing: OutgoingInvitation[]
}) {
  const [respondingId, setRespondingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleAccept = async (id: string) => {
    setRespondingId(id)
    setError(null)
    const result = await acceptTeamInvitation(id)
    setRespondingId(null)
    if (result?.error) setError(result.error)
  }

  const handleDecline = async (id: string) => {
    setRespondingId(id)
    setError(null)
    const result = await declineTeamInvitation(id)
    setRespondingId(null)
    if (result?.error) setError(result.error)
  }

  if (incoming.length === 0 && outgoing.length === 0) return null

  return (
    <div id="team-requests" className="bg-white rounded-none border-2 border-stone-900 p-6 space-y-5 scroll-mt-24 relative">
      {/* Decorative corners */}
      <div className="absolute top-0 left-0 w-2 h-2 bg-stone-900" />
      <div className="absolute top-0 right-0 w-2 h-2 bg-stone-900" />
      <div className="absolute bottom-0 left-0 w-2 h-2 bg-stone-900" />
      <div className="absolute bottom-0 right-0 w-2 h-2 bg-stone-900" />

      <div>
        <h3 className="text-sm font-bold font-mono uppercase text-stone-900 flex items-center gap-2">
          <Mail className="w-4 h-4 text-stone-900" /> Team Invitations
        </h3>
      </div>

      {error && <p className="text-sm font-bold font-mono uppercase text-red-900 bg-red-100 border-2 border-red-900 px-4 py-3">{error}</p>}

      {incoming.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-bold font-mono text-stone-500 uppercase tracking-widest">Received</p>
          <ul className="divide-y-2 divide-stone-200 border-t-2 border-b-2 border-stone-200">
            {incoming.map(invite => (
              <li key={invite.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4">
                <div className="min-w-0">
                  <p className="text-sm font-mono text-stone-900 uppercase">
                    <span className="font-bold text-amber-600">{invite.senderName}</span> INVITED YOU TO JOIN{' '}
                    <span className="font-bold text-amber-600">{invite.teamName}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                  <button
                    onClick={() => handleAccept(invite.id)}
                    disabled={respondingId === invite.id}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 border-2 border-stone-900 text-stone-900 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-xs font-bold font-mono uppercase transition shadow-[2px_2px_0px_0px_#1c1917] active:shadow-none active:translate-y-[2px] active:translate-x-[2px]"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Accept
                  </button>
                  <button
                    onClick={() => handleDecline(invite.id)}
                    disabled={respondingId === invite.id}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 border-2 border-stone-900 text-stone-900 bg-stone-200 hover:bg-stone-300 disabled:opacity-50 text-xs font-bold font-mono uppercase transition shadow-[2px_2px_0px_0px_#1c1917] active:shadow-none active:translate-y-[2px] active:translate-x-[2px]"
                  >
                    <X className="w-3.5 h-3.5" />
                    Decline
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {outgoing.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-bold font-mono text-stone-500 uppercase tracking-widest">Sent by Your Team</p>
          <ul className="divide-y-2 divide-stone-200 border-t-2 border-b-2 border-stone-200">
            {outgoing.map(invite => (
              <li key={invite.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4">
                <p className="text-sm font-bold font-mono uppercase text-stone-900">{invite.recipientName}</p>
                <span className="inline-flex items-center justify-center sm:justify-start gap-1.5 text-xs font-bold font-mono uppercase text-stone-900 bg-stone-200 border-2 border-stone-900 px-3 py-1.5">
                  <Clock className="w-3.5 h-3.5" /> Pending
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
