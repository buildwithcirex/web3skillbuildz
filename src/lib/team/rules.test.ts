import { describe, expect, it } from 'vitest'
import { MAX_TEAM_SIZE, INVITE_COOLDOWN_SECONDS } from './constants'
import {
  canAcceptInvitation,
  canDeclineInvitation,
  canRemoveMember,
  canSendInvitation,
  cooldownRemainingMs,
  deriveCandidateStatus,
  isCooldownActive,
  isTeamFull,
} from './rules'

const LEADER = 'leader-1'
const TEAM = 'team-1'
const RECIPIENT = 'user-2'

function baseSendInput(overrides: Partial<Parameters<typeof canSendInvitation>[0]> = {}) {
  return {
    isAuthenticated: true,
    senderId: LEADER,
    recipientId: RECIPIENT,
    senderTeamId: TEAM,
    isSenderLeader: true,
    senderTeamMemberCount: 1,
    recipientTeamId: null,
    hasPendingInvitationToRecipient: false,
    lastInvitationToRecipientAt: null,
    ...overrides,
  }
}

describe('isTeamFull', () => {
  it('is false below the max team size', () => {
    expect(isTeamFull(MAX_TEAM_SIZE - 1)).toBe(false)
  })

  it('is true at and above the max team size', () => {
    expect(isTeamFull(MAX_TEAM_SIZE)).toBe(true)
    expect(isTeamFull(MAX_TEAM_SIZE + 1)).toBe(true)
  })
})

describe('cooldown math', () => {
  const now = new Date('2026-01-01T00:00:00.000Z')

  it('has no cooldown when there is no prior invitation', () => {
    expect(isCooldownActive(null, now)).toBe(false)
    expect(cooldownRemainingMs(null, now)).toBe(0)
  })

  it('is active immediately after sending', () => {
    expect(isCooldownActive(now.toISOString(), now)).toBe(true)
    expect(cooldownRemainingMs(now.toISOString(), now)).toBe(INVITE_COOLDOWN_SECONDS * 1000)
  })

  it('expires exactly at the cooldown boundary', () => {
    const justBefore = new Date(now.getTime() - (INVITE_COOLDOWN_SECONDS * 1000 - 1))
    const atBoundary = new Date(now.getTime() - INVITE_COOLDOWN_SECONDS * 1000)
    expect(isCooldownActive(justBefore.toISOString(), now)).toBe(true)
    expect(isCooldownActive(atBoundary.toISOString(), now)).toBe(false)
  })

  it('is independent per recipient (A->B cooldown does not block A->C)', () => {
    const sentToB = now.toISOString()
    // A->B is still cooling down...
    expect(isCooldownActive(sentToB, now)).toBe(true)
    // ...but A->C, which has never been sent, is not affected by it.
    expect(isCooldownActive(null, now)).toBe(false)
  })
})

describe('canSendInvitation', () => {
  it('allows a valid invitation from a leader with room on the team', () => {
    expect(canSendInvitation(baseSendInput())).toEqual({ allowed: true })
  })

  it('rejects unauthenticated senders', () => {
    expect(canSendInvitation(baseSendInput({ isAuthenticated: false }))).toEqual({
      allowed: false,
      reason: 'UNAUTHORIZED',
    })
  })

  it('rejects inviting yourself', () => {
    expect(canSendInvitation(baseSendInput({ recipientId: LEADER }))).toEqual({
      allowed: false,
      reason: 'CANNOT_INVITE_SELF',
    })
  })

  it('rejects senders with no team', () => {
    expect(canSendInvitation(baseSendInput({ senderTeamId: null }))).toEqual({
      allowed: false,
      reason: 'NO_TEAM',
    })
  })

  it('rejects non-leader senders (regular members cannot invite)', () => {
    expect(canSendInvitation(baseSendInput({ isSenderLeader: false }))).toEqual({
      allowed: false,
      reason: 'NOT_LEADER',
    })
  })

  it('rejects when the sender team is already full', () => {
    expect(canSendInvitation(baseSendInput({ senderTeamMemberCount: MAX_TEAM_SIZE }))).toEqual({
      allowed: false,
      reason: 'TEAM_FULL',
    })
  })

  it('rejects when the recipient is already in the sender team', () => {
    expect(canSendInvitation(baseSendInput({ recipientTeamId: TEAM }))).toEqual({
      allowed: false,
      reason: 'ALREADY_IN_TEAM',
    })
  })

  it('rejects when the recipient is already in another team', () => {
    expect(canSendInvitation(baseSendInput({ recipientTeamId: 'other-team' }))).toEqual({
      allowed: false,
      reason: 'ALREADY_IN_OTHER_TEAM',
    })
  })

  it('rejects a duplicate pending invitation to the same recipient', () => {
    expect(canSendInvitation(baseSendInput({ hasPendingInvitationToRecipient: true }))).toEqual({
      allowed: false,
      reason: 'DUPLICATE_PENDING',
    })
  })

  it('rejects while the per-recipient cooldown is active', () => {
    const now = new Date('2026-01-01T00:00:10.000Z')
    const result = canSendInvitation(
      baseSendInput({ lastInvitationToRecipientAt: '2026-01-01T00:00:05.000Z', now })
    )
    expect(result).toEqual({ allowed: false, reason: 'COOLDOWN_ACTIVE' })
  })

  it('allows a second invitation to a different recipient during another recipient cooldown', () => {
    const now = new Date('2026-01-01T00:00:10.000Z')
    // A->B just sent (would be blocked), but A->C has no history, so it is allowed.
    const toC = canSendInvitation(
      baseSendInput({ recipientId: 'user-3', lastInvitationToRecipientAt: null, now })
    )
    expect(toC).toEqual({ allowed: true })
  })
})

describe('canDeclineInvitation / canAcceptInvitation (state transitions)', () => {
  const respondBase = { isAuthenticated: true, invitationStatus: 'pending' as const, isRecipient: true }

  it('allows declining a pending invitation owned by the caller', () => {
    expect(canDeclineInvitation(respondBase)).toEqual({ allowed: true })
  })

  it('rejects responding to a request that is not addressed to the caller', () => {
    expect(canDeclineInvitation({ ...respondBase, isRecipient: false })).toEqual({
      allowed: false,
      reason: 'UNAUTHORIZED',
    })
  })

  it('rejects processing an invitation twice (already accepted)', () => {
    expect(canDeclineInvitation({ ...respondBase, invitationStatus: 'accepted' })).toEqual({
      allowed: false,
      reason: 'INVITATION_NOT_PENDING',
    })
  })

  it('rejects processing an invitation twice (already declined)', () => {
    expect(canAcceptInvitation({ ...respondBase, invitationStatus: 'declined', recipientAlreadyInTeam: false, teamMemberCount: 0 })).toEqual({
      allowed: false,
      reason: 'INVITATION_NOT_PENDING',
    })
  })

  it('rejects an unknown invitation id', () => {
    expect(canDeclineInvitation({ ...respondBase, invitationStatus: null })).toEqual({
      allowed: false,
      reason: 'INVITATION_NOT_FOUND',
    })
  })

  it('allows accepting when pending, not in another team, and the team has room', () => {
    expect(canAcceptInvitation({ ...respondBase, recipientAlreadyInTeam: false, teamMemberCount: 1 })).toEqual({
      allowed: true,
    })
  })

  it('rejects accepting when the recipient already belongs to a team', () => {
    expect(canAcceptInvitation({ ...respondBase, recipientAlreadyInTeam: true, teamMemberCount: 1 })).toEqual({
      allowed: false,
      reason: 'ALREADY_IN_TEAM',
    })
  })

  it('rejects accepting when the target team has since become full', () => {
    expect(
      canAcceptInvitation({ ...respondBase, recipientAlreadyInTeam: false, teamMemberCount: MAX_TEAM_SIZE })
    ).toEqual({ allowed: false, reason: 'TEAM_FULL' })
  })
})

describe('canRemoveMember (leader-only permission)', () => {
  const removeBase = {
    isAuthenticated: true,
    callerId: LEADER,
    memberId: RECIPIENT,
    callerIsLeader: true,
    callerTeamId: TEAM,
    memberTeamId: TEAM,
  }

  it('allows the leader to remove a member of their own team', () => {
    expect(canRemoveMember(removeBase)).toEqual({ allowed: true })
  })

  it('rejects a regular member trying to remove someone', () => {
    expect(canRemoveMember({ ...removeBase, callerIsLeader: false })).toEqual({
      allowed: false,
      reason: 'NOT_LEADER',
    })
  })

  it('rejects removing yourself', () => {
    expect(canRemoveMember({ ...removeBase, memberId: LEADER })).toEqual({
      allowed: false,
      reason: 'CANNOT_REMOVE_SELF',
    })
  })

  it('rejects removing a user who is not on the caller team', () => {
    expect(canRemoveMember({ ...removeBase, memberTeamId: 'some-other-team' })).toEqual({
      allowed: false,
      reason: 'NOT_TEAM_MEMBER',
    })
  })
})

describe('deriveCandidateStatus (user search)', () => {
  it('is available when the candidate has no team and no pending invite', () => {
    expect(
      deriveCandidateStatus({ candidateTeamId: null, viewerTeamId: TEAM, hasPendingInvitationFromViewer: false })
    ).toBe('available')
  })

  it('is request_sent when a pending invitation already exists', () => {
    expect(
      deriveCandidateStatus({ candidateTeamId: null, viewerTeamId: TEAM, hasPendingInvitationFromViewer: true })
    ).toBe('request_sent')
  })

  it('is already_in_team when the candidate is on the viewer team', () => {
    expect(
      deriveCandidateStatus({ candidateTeamId: TEAM, viewerTeamId: TEAM, hasPendingInvitationFromViewer: false })
    ).toBe('already_in_team')
  })

  it('is already_in_other_team when the candidate is on a different team', () => {
    expect(
      deriveCandidateStatus({ candidateTeamId: 'other-team', viewerTeamId: TEAM, hasPendingInvitationFromViewer: false })
    ).toBe('already_in_other_team')
  })
})
