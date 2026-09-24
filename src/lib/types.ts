export type UserRole = 'participant' | 'admin'

export interface Profile {
  id: string
  name: string
  email: string
  phone: string
  role: UserRole
  created_at: string
}

export interface EventConfig {
  id: number
  submissions_locked: boolean
  scores_published?: boolean
  team_formation_locked?: boolean
  updated_at?: string
}
