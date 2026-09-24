export type TeamMemberRole = 'leader' | 'member'

export interface TeamMember {
  id: string
  name: string
  email: string
  role: TeamMemberRole
  joinedAt: string
}

export interface Team {
  id: string
  name: string
  leaderId: string
  isLeader: boolean
  capacity: number
  members: TeamMember[]
}

export interface IncomingInvitation {
  id: string
  teamId: string
  teamName: string
  senderId: string
  senderName: string
  createdAt: string
}

export interface OutgoingInvitation {
  id: string
  recipientId: string
  recipientName: string
  createdAt: string
}

export interface MyInvitations {
  incoming: IncomingInvitation[]
  outgoing: OutgoingInvitation[]
}

export type CandidateStatus =
  | 'available'
  | 'request_sent'
  | 'already_in_team'
  | 'already_in_other_team'

export interface TeamCandidate {
  id: string
  name: string
  email: string
  status: CandidateStatus
}

// Error codes raised by the RPC functions in files/team_system_schema.sql.
export type TeamErrorCode =
  | 'UNAUTHORIZED'
  | 'ALREADY_IN_TEAM'
  | 'ALREADY_IN_OTHER_TEAM'
  | 'NO_TEAM'
  | 'NOT_LEADER'
  | 'NOT_TEAM_MEMBER'
  | 'CANNOT_INVITE_SELF'
  | 'CANNOT_REMOVE_SELF'
  | 'RECIPIENT_NOT_FOUND'
  | 'TEAM_FULL'
  | 'DUPLICATE_PENDING'
  | 'COOLDOWN_ACTIVE'
  | 'INVITATION_NOT_FOUND'
  | 'INVITATION_NOT_PENDING'

export const TEAM_ERROR_MESSAGES: Record<TeamErrorCode, string> = {
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  ALREADY_IN_TEAM: 'You are already part of a team.',
  ALREADY_IN_OTHER_TEAM: 'This user already belongs to another team.',
  NO_TEAM: 'You need to create or join a team first.',
  NOT_LEADER: 'Only the team leader can do this.',
  NOT_TEAM_MEMBER: 'That user is not a member of your team.',
  CANNOT_INVITE_SELF: 'You cannot invite yourself.',
  CANNOT_REMOVE_SELF: 'You cannot remove yourself from the team.',
  RECIPIENT_NOT_FOUND: 'This user no longer exists.',
  TEAM_FULL: 'This team is already full.',
  DUPLICATE_PENDING: 'There is already a pending invitation for this user.',
  COOLDOWN_ACTIVE: 'Please wait a few seconds before inviting this user again.',
  INVITATION_NOT_FOUND: 'This invitation no longer exists.',
  INVITATION_NOT_PENDING: 'This invitation has already been processed.',
}

export const DEFAULT_TEAM_ERROR_MESSAGE =
  'Something went wrong with your team request. Please try again.'
