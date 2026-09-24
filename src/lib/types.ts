export type UserRole = 'participant' | 'admin'

export interface Profile {
  id: string
  name: string
  email: string
  phone: string
  role: UserRole
  project_description: string | null
  deploy_link: string | null
  screenshot_url: string | null
  score?: number | null
  feedback?: string | null
  created_at: string
}

export interface EventConfig {
  id: number
  submissions_locked: boolean
  scores_published?: boolean
  updated_at?: string
}

export type TeamRequestStatus = 'pending' | 'accepted' | 'declined'

export interface TeamMemberSummary {
  id: string
  name: string
  email: string
}

export interface TeamIncomingRequest {
  id: string
  senderId: string
  senderName: string
  senderEmail: string
  createdAt: string
}

export interface TeamOverview {
  error: string | null
  canManageTeam: boolean
  isTeamFull: boolean
  teamLeaderId: string | null
  teamMembers: TeamMemberSummary[]
  participants: TeamMemberSummary[]
  incomingRequests: TeamIncomingRequest[]
  outgoingRequestStatusByRecipient: Record<string, 'Request Sent' | 'Accepted' | 'Declined'>
  sameTeamMemberIds: string[]
}
