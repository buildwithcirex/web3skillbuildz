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
    <div id="team-requests" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5 scroll-mt-24">
      <div>
        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
          <Mail className="w-4 h-4 text-indigo-600" /> Team Invitations
        </h3>
      </div>

      {error && <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>}

      {incoming.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Received</p>
          <ul className="divide-y divide-gray-50">
            {incoming.map(invite => (
              <li key={invite.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    <span className="font-semibold">{invite.senderName}</span> invited you to join{' '}
                    <span className="font-semibold">{invite.teamName}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleAccept(invite.id)}
                    disabled={respondingId === invite.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-xs font-semibold transition"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Accept
                  </button>
                  <button
                    onClick={() => handleDecline(invite.id)}
                    disabled={respondingId === invite.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-xs font-semibold transition"
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
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Sent by Your Team</p>
          <ul className="divide-y divide-gray-50">
            {outgoing.map(invite => (
              <li key={invite.id} className="flex items-center justify-between gap-3 py-3">
                <p className="text-sm text-gray-700">{invite.recipientName}</p>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full">
                  <Clock className="w-3 h-3" /> Pending
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
