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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl font-bold font-mono uppercase text-stone-900 border-l-4 border-amber-400 pl-3">Team Configuration</h2>
        {showPrompt && (
          <button
            onClick={() => void requestPermission()}
            className="inline-flex w-fit items-center gap-1.5 px-3 py-1.5 border-2 border-stone-900 bg-amber-400 text-stone-900 text-xs font-bold font-mono uppercase shadow-[2px_2px_0px_0px_#1c1917] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition"
          >
            <Bell className="w-3.5 h-3.5" />
            Enable Alerts
          </button>
        )}
      </div>

      <PendingInvitationsPanel incoming={invitations.incoming} outgoing={invitations.outgoing} />

      {team ? (
        <>
          <TeamOverviewCard team={team} currentUserId={currentUserId} />
          {(team.isLeader || team.leaderId === currentUserId) && !team.isLocked && (isFull ? (
            <p className="text-sm font-bold font-mono text-amber-900 bg-amber-100 border-2 border-amber-900 px-4 py-3 uppercase">
              WARNING: Team capacity reached. Remove a member to free up a slot.
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
