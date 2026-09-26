'use client'

import { Bell } from 'lucide-react'
import { useTeamNotifications } from '@/lib/team/useTeamNotifications'
import type { MyInvitations, Team } from '@/lib/team/types'
import CreateTeamPrompt from './CreateTeamPrompt'
import TeamOverviewCard from './TeamOverviewCard'
import UserSearchPanel from './UserSearchPanel'
import PendingInvitationsPanel from './PendingInvitationsPanel'

export default function TeamSection({
  currentUserId,
  team,
  invitations,
}: {
  currentUserId: string
  team: Team | null
  invitations: MyInvitations
}) {
  const { showPrompt, requestPermission } = useTeamNotifications(currentUserId)
  const isFull = !!team && team.members.length >= team.capacity

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Team</h2>
        {showPrompt && (
          <button
            onClick={() => void requestPermission()}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition"
          >
            <Bell className="w-3.5 h-3.5" />
            Enable notifications for team invites
          </button>
        )}
      </div>

      <PendingInvitationsPanel incoming={invitations.incoming} outgoing={invitations.outgoing} />

      {team ? (
        <>
          <TeamOverviewCard team={team} currentUserId={currentUserId} />
          {(team.isLeader || team.leaderId === currentUserId) && !team.isLocked && (isFull ? (
            <p className="text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
              Your team is full. Remove a member to invite someone new.
            </p>
          ) : (
            <UserSearchPanel />
          ))}
        </>
      ) : (
        <CreateTeamPrompt />
      )}
    </section>
  )
}
