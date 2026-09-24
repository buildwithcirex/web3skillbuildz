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
