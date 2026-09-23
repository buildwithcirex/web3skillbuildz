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
