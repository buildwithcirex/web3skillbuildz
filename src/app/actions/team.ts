'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import {
  TEAM_ERROR_MESSAGES,
  DEFAULT_TEAM_ERROR_MESSAGE,
  type TeamErrorCode,
} from '@/lib/team/types'

type ActionResult = { error: string | null }

// The RPC functions in files/team_system_schema.sql raise plain error codes
// (e.g. "COOLDOWN_ACTIVE") via RAISE EXCEPTION; Supabase surfaces that text
// as error.message. Map it to the user-facing copy in TEAM_ERROR_MESSAGES.
function toUserMessage(rawMessage: string | undefined): string {
  const code = (rawMessage ?? '').trim() as TeamErrorCode
  return TEAM_ERROR_MESSAGES[code] ?? DEFAULT_TEAM_ERROR_MESSAGE
}

async function getAuthedClient() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/')
  return { supabase, user }
}

export async function createTeam(teamName?: string): Promise<ActionResult> {
  const { supabase } = await getAuthedClient()

  const { error } = await supabase.rpc('create_team', { p_name: teamName ?? null })
  if (error) return { error: toUserMessage(error.message) }

  revalidatePath('/dashboard')
  return { error: null }
}

export async function searchTeamCandidates(query: string) {
  const { supabase } = await getAuthedClient()

  const { data, error } = await supabase.rpc('search_team_candidates', { p_query: query })
  if (error) return { error: toUserMessage(error.message), candidates: [] as const }

  return { error: null, candidates: data ?? [] }
}

export async function sendTeamInvitation(recipientId: string): Promise<ActionResult> {
  const { supabase } = await getAuthedClient()

  const { error } = await supabase.rpc('send_team_invitation', { p_recipient_id: recipientId })
  if (error) return { error: toUserMessage(error.message) }

  revalidatePath('/dashboard')
  return { error: null }
}

export async function acceptTeamInvitation(invitationId: string): Promise<ActionResult> {
  const { supabase } = await getAuthedClient()

  const { error } = await supabase.rpc('accept_team_invitation', { p_invitation_id: invitationId })
  if (error) return { error: toUserMessage(error.message) }

  revalidatePath('/dashboard')
  return { error: null }
}

export async function declineTeamInvitation(invitationId: string): Promise<ActionResult> {
  const { supabase } = await getAuthedClient()

  const { error } = await supabase.rpc('decline_team_invitation', { p_invitation_id: invitationId })
  if (error) return { error: toUserMessage(error.message) }

  revalidatePath('/dashboard')
  return { error: null }
}

export async function removeTeamMember(memberId: string): Promise<ActionResult> {
  const { supabase } = await getAuthedClient()

  const { error } = await supabase.rpc('remove_team_member', { p_member_id: memberId })
  if (error) return { error: toUserMessage(error.message) }

  revalidatePath('/dashboard')
  return { error: null }
}

// Auto-creates a solo team ("{FirstName}'s Team") the first time a teamless
// participant tries to submit. A no-op if they're already on a team.
export async function ensureSoloTeam(): Promise<ActionResult> {
  const { supabase, user } = await getAuthedClient()

  const { data: existing } = await supabase.rpc('get_my_team')
  if (existing) return { error: null }

  const { data: profile } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', user.id)
    .maybeSingle()

  const firstName = (profile?.name ?? '').trim().split(/\s+/)[0] || 'My'

  const { error } = await supabase.rpc('create_team', { p_name: `${firstName}'s Team` })
  if (error) return { error: toUserMessage(error.message) }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/submit')
  return { error: null }
}

export async function lockTeam(): Promise<ActionResult> {
  const { supabase } = await getAuthedClient()

  const { error } = await supabase.rpc('lock_team')
  if (error) return { error: toUserMessage(error.message) }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/submit')
  return { error: null }
}

export async function leaveTeam(): Promise<ActionResult> {
  const { supabase, user } = await getAuthedClient()

  // 1. If this person is the leader, we should clean up their team's screenshot
  // from storage before disbanding the team (which will be handled by the RPC).
  const { data: teamData } = await supabase.rpc('get_my_team')
  if (teamData?.isLeader && teamData.screenshotUrl) {
    try {
      const parts = teamData.screenshotUrl.split('/project_screenshots/')
      if (parts.length > 1) {
        const filePath = decodeURIComponent(parts[1])
        await supabase.storage.from('project_screenshots').remove([filePath])
      }
    } catch (err) {
      console.error('Error removing screenshot during leaveTeam:', err)
    }
  }

  // 2. Call the RPC to actually leave the team (or disband it)
  const { error } = await supabase.rpc('leave_team')
  if (error) return { error: toUserMessage(error.message) }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/submit')
  return { error: null }
}
