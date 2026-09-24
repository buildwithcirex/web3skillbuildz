'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { TeamIncomingRequest, TeamMemberSummary, TeamOverview, TeamRequestStatus } from '@/lib/types'

const TEAM_MAX_MEMBERS = 3
const REQUEST_COOLDOWN_MS = 10_000

interface TeamContext {
  teamId: string
  leaderId: string
  memberIds: string[]
}

function mapTeamError(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  return 'Something went wrong while processing team data.'
}

async function requireUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Authentication required.')
  }

  return { supabase, user }
}

async function getTeamContext(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<TeamContext | null> {
  const { data: membership, error: membershipError } = await supabase
    .from('team_members')
    .select('team_id')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle<{ team_id: string }>()

  if (membershipError) {
    throw new Error(membershipError.message)
  }

  if (!membership?.team_id) return null

  const { data: team, error: teamError } = await supabase
    .from('teams')
    .select('id, leader_id')
    .eq('id', membership.team_id)
    .limit(1)
    .maybeSingle<{ id: string; leader_id: string }>()

  if (teamError) {
    throw new Error(teamError.message)
  }

  if (!team) {
    return null
  }

  const { data: members, error: membersError } = await supabase
    .from('team_members')
    .select('user_id')
    .eq('team_id', team.id)

  if (membersError) {
    throw new Error(membersError.message)
  }

  return {
    teamId: team.id,
    leaderId: team.leader_id,
    memberIds: (members ?? []).map((member) => member.user_id as string),
  }
}

async function ensureTeamExistsForLeader(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
) {
  const context = await getTeamContext(supabase, userId)

  if (context) {
    if (context.leaderId !== userId) {
      throw new Error('Only the team leader can add members.')
    }
    return context
  }

  const { data: team, error: teamError } = await supabase
    .from('teams')
    .insert({ leader_id: userId })
    .select('id, leader_id')
    .single<{ id: string; leader_id: string }>()

  if (teamError || !team) {
    throw new Error(teamError?.message ?? 'Failed to create a team.')
  }

  const { error: joinError } = await supabase
    .from('team_members')
    .insert({ team_id: team.id, user_id: userId })

  if (joinError) {
    throw new Error(joinError.message)
  }

  return {
    teamId: team.id,
    leaderId: team.leader_id,
    memberIds: [userId],
  }
}

async function buildMemberSummaryMap(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userIds: string[]
) {
  if (userIds.length === 0) return new Map<string, TeamMemberSummary>()

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, name, email')
    .in('id', userIds)

  if (error) throw new Error(error.message)

  return new Map(
    (profiles ?? []).map((profile) => [
      profile.id as string,
      {
        id: profile.id as string,
        name: profile.name as string,
        email: profile.email as string,
      },
    ])
  )
}

export async function getTeamOverview(): Promise<TeamOverview> {
  try {
    const { supabase, user } = await requireUser()

    const { data: participants, error: participantsError } = await supabase
      .from('profiles')
      .select('id, name, email, role')
      .neq('id', user.id)
      .eq('role', 'participant')
      .order('name', { ascending: true })

    if (participantsError) {
      throw new Error(participantsError.message)
    }

    const context = await getTeamContext(supabase, user.id)
    const sameTeamMemberIds = context?.memberIds ?? []
    const memberSummaryMap = await buildMemberSummaryMap(supabase, sameTeamMemberIds)
    const teamMembers = sameTeamMemberIds
      .map((memberId) => memberSummaryMap.get(memberId))
      .filter((member): member is TeamMemberSummary => Boolean(member))

    const { data: incoming, error: incomingError } = await supabase
      .from('team_requests')
      .select('id, sender_id, created_at')
      .eq('recipient_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (incomingError) {
      throw new Error(incomingError.message)
    }

    const senderIds = Array.from(new Set((incoming ?? []).map((request) => request.sender_id as string)))
    const senderMap = await buildMemberSummaryMap(supabase, senderIds)

    const incomingRequests: TeamIncomingRequest[] = (incoming ?? []).map((request) => {
      const sender = senderMap.get(request.sender_id as string)
      return {
        id: request.id as string,
        senderId: request.sender_id as string,
        senderName: sender?.name ?? 'Unknown User',
        senderEmail: sender?.email ?? 'unknown@example.com',
        createdAt: request.created_at as string,
      }
    })

    const { data: outgoingRequests, error: outgoingError } = await supabase
      .from('team_requests')
      .select('recipient_id, status, created_at')
      .eq('sender_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100)

    if (outgoingError) {
      throw new Error(outgoingError.message)
    }

    const outgoingRequestStatusByRecipient: Record<string, 'Request Sent' | 'Accepted' | 'Declined'> = {}
    for (const request of outgoingRequests ?? []) {
      const recipientId = request.recipient_id as string
      if (outgoingRequestStatusByRecipient[recipientId]) continue

      const status = request.status as TeamRequestStatus
      if (status === 'pending') {
        outgoingRequestStatusByRecipient[recipientId] = 'Request Sent'
      } else if (status === 'accepted') {
        outgoingRequestStatusByRecipient[recipientId] = 'Accepted'
      } else if (status === 'declined') {
        outgoingRequestStatusByRecipient[recipientId] = 'Declined'
      }
    }

    return {
      error: null,
      canManageTeam: !context || context.leaderId === user.id,
      isTeamFull: (context?.memberIds.length ?? 0) >= TEAM_MAX_MEMBERS,
      teamLeaderId: context?.leaderId ?? null,
      teamMembers,
      participants: (participants ?? []).map((participant) => ({
        id: participant.id as string,
        name: participant.name as string,
        email: participant.email as string,
      })),
      incomingRequests,
      outgoingRequestStatusByRecipient,
      sameTeamMemberIds,
    }
  } catch (error) {
    return {
      error: mapTeamError(error),
      canManageTeam: false,
      isTeamFull: false,
      teamLeaderId: null,
      teamMembers: [],
      participants: [],
      incomingRequests: [],
      outgoingRequestStatusByRecipient: {},
      sameTeamMemberIds: [],
    }
  }
}

export async function sendTeamRequest(recipientId: string) {
  try {
    const { supabase, user } = await requireUser()

    if (!recipientId || recipientId === user.id) {
      return { success: false, status: 'Invalid recipient.' }
    }

    const senderTeam = await ensureTeamExistsForLeader(supabase, user.id)

    if (senderTeam.memberIds.includes(recipientId)) {
      return { success: false, status: 'Already in team' }
    }

    if (senderTeam.memberIds.length >= TEAM_MAX_MEMBERS) {
      return { success: false, status: 'Team Full' }
    }

    const { data: recipientMembership, error: recipientMembershipError } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', recipientId)
      .limit(1)
      .maybeSingle<{ team_id: string }>()

    if (recipientMembershipError) {
      throw new Error(recipientMembershipError.message)
    }

    if (recipientMembership?.team_id === senderTeam.teamId) {
      return { success: false, status: 'Already in team' }
    }

    const { data: existingPending, error: existingPendingError } = await supabase
      .from('team_requests')
      .select('id')
      .eq('sender_id', user.id)
      .eq('recipient_id', recipientId)
      .eq('status', 'pending')
      .limit(1)
      .maybeSingle()

    if (existingPendingError) {
      throw new Error(existingPendingError.message)
    }

    if (existingPending) {
      return { success: false, status: 'Request Sent' }
    }

    const { data: lastRequest, error: lastRequestError } = await supabase
      .from('team_requests')
      .select('created_at')
      .eq('sender_id', user.id)
      .eq('recipient_id', recipientId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle<{ created_at: string }>()

    if (lastRequestError) {
      throw new Error(lastRequestError.message)
    }

    if (lastRequest?.created_at) {
      const elapsedMs = Date.now() - new Date(lastRequest.created_at).getTime()
      if (elapsedMs < REQUEST_COOLDOWN_MS) {
        const remainingSeconds = Math.ceil((REQUEST_COOLDOWN_MS - elapsedMs) / 1000)
        return {
          success: false,
          status: `Please wait ${remainingSeconds}s before sending another request.`,
        }
      }
    }

    const { error: insertError } = await supabase
      .from('team_requests')
      .insert({
        sender_id: user.id,
        recipient_id: recipientId,
        team_id: senderTeam.teamId,
        status: 'pending',
      })

    if (insertError) {
      throw new Error(insertError.message)
    }

    revalidatePath('/dashboard')
    return { success: true, status: 'Request Sent' }
  } catch (error) {
    return { success: false, status: mapTeamError(error) }
  }
}

export async function respondToTeamRequest(requestId: string, decision: 'accepted' | 'declined') {
  try {
    const { supabase, user } = await requireUser()

    const { data: request, error: requestError } = await supabase
      .from('team_requests')
      .select('id, sender_id, recipient_id, team_id, status')
      .eq('id', requestId)
      .limit(1)
      .maybeSingle<{
        id: string
        sender_id: string
        recipient_id: string
        team_id: string
        status: TeamRequestStatus
      }>()

    if (requestError) {
      throw new Error(requestError.message)
    }

    if (!request || request.recipient_id !== user.id) {
      return { success: false, status: 'Request not found.' }
    }

    if (request.status !== 'pending') {
      return { success: false, status: request.status === 'accepted' ? 'Accepted' : 'Declined' }
    }

    if (decision === 'declined') {
      const { error: declineError } = await supabase
        .from('team_requests')
        .update({ status: 'declined' })
        .eq('id', request.id)

      if (declineError) {
        throw new Error(declineError.message)
      }

      revalidatePath('/dashboard')
      return { success: true, status: 'Declined' }
    }

    const recipientTeam = await getTeamContext(supabase, user.id)
    if (recipientTeam) {
      return { success: false, status: 'Already in team' }
    }

    const senderTeam = await getTeamContext(supabase, request.sender_id)
    if (!senderTeam || senderTeam.teamId !== request.team_id) {
      return { success: false, status: 'Sender team not found.' }
    }

    if (senderTeam.leaderId !== request.sender_id) {
      return { success: false, status: 'Only the team leader can add members.' }
    }

    if (senderTeam.memberIds.length >= TEAM_MAX_MEMBERS) {
      return { success: false, status: 'Team Full' }
    }

    const { error: insertMemberError } = await supabase
      .from('team_members')
      .insert({ team_id: senderTeam.teamId, user_id: user.id })

    if (insertMemberError) {
      throw new Error(insertMemberError.message)
    }

    const { error: acceptError } = await supabase
      .from('team_requests')
      .update({ status: 'accepted' })
      .eq('id', request.id)

    if (acceptError) {
      throw new Error(acceptError.message)
    }

    revalidatePath('/dashboard')
    return { success: true, status: 'Accepted' }
  } catch (error) {
    return { success: false, status: mapTeamError(error) }
  }
}

export async function removeTeamMember(memberId: string) {
  try {
    const { supabase, user } = await requireUser()
    const context = await getTeamContext(supabase, user.id)

    if (!context) {
      return { success: false, status: 'Team not found.' }
    }

    if (context.leaderId !== user.id) {
      return { success: false, status: 'Only the team leader can remove members.' }
    }

    if (memberId === user.id) {
      return { success: false, status: 'Team leader cannot be removed.' }
    }

    if (!context.memberIds.includes(memberId)) {
      return { success: false, status: 'User is not in your team.' }
    }

    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('team_id', context.teamId)
      .eq('user_id', memberId)

    if (error) {
      throw new Error(error.message)
    }

    revalidatePath('/dashboard')
    return { success: true, status: 'Member removed.' }
  } catch (error) {
    return { success: false, status: mapTeamError(error) }
  }
}

