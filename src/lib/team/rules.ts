// Pure business-rule helpers for the Team Building system.
//
// These are called from src/app/actions/team.ts for fast, friendly
// early validation before hitting the database, and are the thing unit
// tested in rules.test.ts. They intentionally know nothing about
// Supabase — the RPC functions in files/team_system_schema.sql remain
// the final authority (see database_schema.md).

import { MAX_TEAM_SIZE, INVITE_COOLDOWN_SECONDS } from './constants'
import type { CandidateStatus, TeamErrorCode } from './types'

export type InvitationStatus = 'pending' | 'accepted' | 'declined'

export type RuleResult = { allowed: true } | { allowed: false; reason: TeamErrorCode }

export function isTeamFull(memberCount: number): boolean {
  return memberCount >= MAX_TEAM_SIZE
}

export function cooldownRemainingMs(lastInvitedAt: string | null, now: Date = new Date()): number {
  if (!lastInvitedAt) return 0
  const elapsed = now.getTime() - new Date(lastInvitedAt).getTime()
  const remaining = INVITE_COOLDOWN_SECONDS * 1000 - elapsed
  return remaining > 0 ? remaining : 0
}

export function isCooldownActive(lastInvitedAt: string | null, now: Date = new Date()): boolean {
  return cooldownRemainingMs(lastInvitedAt, now) > 0
}

export interface SendInvitationInput {
  isAuthenticated: boolean
  senderId: string
  recipientId: string
  senderTeamId: string | null
  isSenderLeader: boolean
  senderTeamMemberCount: number
  recipientTeamId: string | null
  hasPendingInvitationToRecipient: boolean
  lastInvitationToRecipientAt: string | null
  now?: Date
}

export function canSendInvitation(input: SendInvitationInput): RuleResult {
  const now = input.now ?? new Date()

  if (!input.isAuthenticated) return { allowed: false, reason: 'UNAUTHORIZED' }
  if (input.senderId === input.recipientId) return { allowed: false, reason: 'CANNOT_INVITE_SELF' }
  if (!input.senderTeamId) return { allowed: false, reason: 'NO_TEAM' }
  if (!input.isSenderLeader) return { allowed: false, reason: 'NOT_LEADER' }
  if (isTeamFull(input.senderTeamMemberCount)) return { allowed: false, reason: 'TEAM_FULL' }

  if (input.recipientTeamId) {
    return {
      allowed: false,
      reason: input.recipientTeamId === input.senderTeamId ? 'ALREADY_IN_TEAM' : 'ALREADY_IN_OTHER_TEAM',
    }
  }

  if (input.hasPendingInvitationToRecipient) return { allowed: false, reason: 'DUPLICATE_PENDING' }
  if (isCooldownActive(input.lastInvitationToRecipientAt, now)) return { allowed: false, reason: 'COOLDOWN_ACTIVE' }

  return { allowed: true }
}

export interface RespondInvitationInput {
  isAuthenticated: boolean
  invitationStatus: InvitationStatus | null
  isRecipient: boolean
}

export function canDeclineInvitation(input: RespondInvitationInput): RuleResult {
  if (!input.isAuthenticated) return { allowed: false, reason: 'UNAUTHORIZED' }
  if (input.invitationStatus === null) return { allowed: false, reason: 'INVITATION_NOT_FOUND' }
  if (!input.isRecipient) return { allowed: false, reason: 'UNAUTHORIZED' }
  if (input.invitationStatus !== 'pending') return { allowed: false, reason: 'INVITATION_NOT_PENDING' }
  return { allowed: true }
}

export interface AcceptInvitationInput extends RespondInvitationInput {
  recipientAlreadyInTeam: boolean
  teamMemberCount: number
}

export function canAcceptInvitation(input: AcceptInvitationInput): RuleResult {
  const base = canDeclineInvitation(input)
  if (!base.allowed) return base
  if (input.recipientAlreadyInTeam) return { allowed: false, reason: 'ALREADY_IN_TEAM' }
  if (isTeamFull(input.teamMemberCount)) return { allowed: false, reason: 'TEAM_FULL' }
  return { allowed: true }
}

export interface RemoveMemberInput {
  isAuthenticated: boolean
  callerId: string
  memberId: string
  callerIsLeader: boolean
  callerTeamId: string | null
  memberTeamId: string | null
}

export function canRemoveMember(input: RemoveMemberInput): RuleResult {
  if (!input.isAuthenticated) return { allowed: false, reason: 'UNAUTHORIZED' }
  if (input.callerId === input.memberId) return { allowed: false, reason: 'CANNOT_REMOVE_SELF' }
  if (!input.callerTeamId || !input.callerIsLeader) return { allowed: false, reason: 'NOT_LEADER' }
  if (!input.memberTeamId || input.memberTeamId !== input.callerTeamId) {
    return { allowed: false, reason: 'NOT_TEAM_MEMBER' }
  }
  return { allowed: true }
}

export interface DeriveCandidateStatusInput {
  candidateTeamId: string | null
  viewerTeamId: string | null
  hasPendingInvitationFromViewer: boolean
}

export function deriveCandidateStatus(input: DeriveCandidateStatusInput): CandidateStatus {
  if (input.candidateTeamId) {
    return input.candidateTeamId === input.viewerTeamId ? 'already_in_team' : 'already_in_other_team'
  }
  if (input.hasPendingInvitationFromViewer) return 'request_sent'
  return 'available'
}
