'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import type { TeamOverview } from '@/lib/types'
import { removeTeamMember, respondToTeamRequest, sendTeamRequest } from '@/app/actions/team'

interface TeamBuilderSectionProps {
  overview: TeamOverview
}

export default function TeamBuilderSection({ overview }: TeamBuilderSectionProps) {
  const [searchText, setSearchText] = useState('')
  const [message, setMessage] = useState<string | null>(overview.error)
  const [isPending, startTransition] = useTransition()
  const seenRequestIdsRef = useRef(new Set(overview.incomingRequests.map((request) => request.id)))

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return

    if (Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {})
    }

    const interval = window.setInterval(async () => {
      try {
        const response = await fetch('/api/team/incoming', { cache: 'no-store' })
        if (!response.ok) return

        const data = (await response.json()) as {
          requests: Array<{ id: string; senderName: string }>
        }

        for (const request of data.requests) {
          if (!seenRequestIdsRef.current.has(request.id) && Notification.permission === 'granted') {
            new Notification('New Team Request', {
              body: `${request.senderName} sent you a team request.`,
            })
          }
          seenRequestIdsRef.current.add(request.id)
        }
      } catch {
        // Ignore polling errors.
      }
    }, 5000)

    return () => window.clearInterval(interval)
  }, [])

  const filteredParticipants = useMemo(() => {
    const normalizedQuery = searchText.trim().toLowerCase()
    if (!normalizedQuery) return overview.participants

    return overview.participants.filter((participant) => (
      participant.name.toLowerCase().includes(normalizedQuery)
      || participant.email.toLowerCase().includes(normalizedQuery)
    ))
  }, [overview.participants, searchText])

  const isInATeam = overview.teamLeaderId !== null

  const handleSendRequest = (recipientId: string) => {
    startTransition(async () => {
      const result = await sendTeamRequest(recipientId)
      setMessage(result.status)
    })
  }

  const handleRequestDecision = (requestId: string, decision: 'accepted' | 'declined') => {
    startTransition(async () => {
      const result = await respondToTeamRequest(requestId, decision)
      setMessage(result.status)
    })
  }

  const handleRemoveMember = (memberId: string) => {
    startTransition(async () => {
      const result = await removeTeamMember(memberId)
      setMessage(result.status)
    })
  }

  return (
    <section className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-gray-900">Team Builder</h3>
          {overview.isTeamFull && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
              Team Full
            </span>
          )}
        </div>

        {message && (
          <p className="text-sm text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2">
            {message}
          </p>
        )}

        {!overview.canManageTeam && (
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
            Only the team leader can add or remove members.
          </p>
        )}

        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Current Team</p>
          {overview.teamMembers.length === 0 ? (
            <p className="text-sm text-gray-500">You are not in a team yet.</p>
          ) : (
            <ul className="space-y-2">
              {overview.teamMembers.map((member) => {
                const isLeader = member.id === overview.teamLeaderId

                return (
                  <li
                    key={member.id}
                    className="flex items-center justify-between border border-gray-200 rounded-lg px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {member.name}
                        {isLeader ? ' (Leader)' : ''}
                      </p>
                      <p className="text-xs text-gray-500">{member.email}</p>
                    </div>
                    {overview.canManageTeam && !isLeader && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(member.id)}
                        disabled={isPending}
                        className="text-xs font-semibold text-red-600 hover:text-red-700 disabled:opacity-50"
                      >
                        Remove
                      </button>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-gray-900">Incoming Requests</h3>
          <span className="text-xs font-medium text-gray-500">
            {overview.incomingRequests.length} Pending
          </span>
        </div>

        {overview.incomingRequests.length === 0 ? (
          <p className="text-sm text-gray-500">No pending requests.</p>
        ) : (
          <ul className="space-y-2">
            {overview.incomingRequests.map((request) => (
              <li
                key={request.id}
                className="border border-gray-200 rounded-lg px-3 py-3 space-y-2"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{request.senderName}</p>
                    <p className="text-xs text-gray-500">{request.senderEmail}</p>
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                    Pending
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleRequestDecision(request.id, 'accepted')}
                    disabled={isPending}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRequestDecision(request.id, 'declined')}
                    disabled={isPending}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-200 text-gray-800 hover:bg-gray-300 disabled:opacity-50"
                  >
                    Decline
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Find Teammates</h3>
        <input
          type="text"
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
          placeholder="Search by name or email..."
          className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />

        {filteredParticipants.length === 0 ? (
          <p className="text-sm text-gray-500">No users found.</p>
        ) : (
          <ul className="space-y-2">
            {filteredParticipants.map((participant) => {
              const isAlreadyInTeam = overview.sameTeamMemberIds.includes(participant.id)
              const outgoingStatus = overview.outgoingRequestStatusByRecipient[participant.id]

              let statusLabel: 'Already in team' | 'Team Full' | 'Request Sent' | 'Accepted' | 'Declined' | null = null

              if (isAlreadyInTeam) {
                statusLabel = 'Already in team'
              } else if (overview.isTeamFull) {
                statusLabel = 'Team Full'
              } else if (outgoingStatus) {
                statusLabel = outgoingStatus
              }

              const canSendRequest = !statusLabel && (overview.canManageTeam || !isInATeam)

              return (
                <li
                  key={participant.id}
                  className="flex items-center justify-between border border-gray-200 rounded-lg px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{participant.name}</p>
                    <p className="text-xs text-gray-500">{participant.email}</p>
                  </div>

                  {canSendRequest ? (
                    <button
                      type="button"
                      onClick={() => handleSendRequest(participant.id)}
                      disabled={isPending}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                      Send Request
                    </button>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                      {statusLabel ?? 'Only Leader Can Add'}
                    </span>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </section>
  )
}
