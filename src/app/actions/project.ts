'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// Helper to check admin status reliably
async function checkIsAdmin(supabase: Awaited<ReturnType<typeof createClient>>, user: { id: string; email?: string }) {
  if (
    user.email &&
    process.env.NEXT_PUBLIC_ADMIN_EMAIL &&
    user.email.toLowerCase() === process.env.NEXT_PUBLIC_ADMIN_EMAIL.toLowerCase()
  ) {
    return true
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  return profile?.role === 'admin'
}

function toSubmissionMessage(rawMessage: string | undefined): string {
  switch ((rawMessage ?? '').trim()) {
    case 'NO_TEAM':
      return 'You need to be part of a team to submit a project.'
    case 'TEAM_NOT_LOCKED':
      return 'Your team must be locked before you can submit.'
    case 'SUBMISSIONS_LOCKED':
      return 'Submissions have been locked by the event organizer. No changes can be submitted.'
    default:
      return rawMessage || 'Something went wrong while saving your submission.'
  }
}

export async function submitProject(
  prevState: { error: string | null; success: boolean },
  formData: FormData
) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const description = formData.get('project_description') as string
  const deployLink = formData.get('deploy_link') as string
  const screenshotUrl = formData.get('screenshot_url') as string

  if (!description || !deployLink || !screenshotUrl) {
    return { error: 'All fields including screenshot are required.', success: false }
  }

  const { error } = await supabase.rpc('submit_team_project', {
    p_description: description,
    p_deploy_link: deployLink,
    p_screenshot_url: screenshotUrl,
  })

  if (error) {
    return { error: toSubmissionMessage(error.message), success: false }
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/submit')
  revalidatePath('/admin')
  return { error: null, success: true }
}

export async function revertSubmission() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { error } = await supabase.rpc('revert_team_submission')

  if (error) return { error: toSubmissionMessage(error.message) }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/submit')
  revalidatePath('/admin')
  return { error: null }
}

export async function toggleSubmissionsLock(locked: boolean) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const isAdmin = await checkIsAdmin(supabase, user)
  if (!isAdmin) {
    return { error: 'Unauthorized: Admin access required.' }
  }

  const { error } = await supabase
    .from('event_config')
    .upsert({
      id: 1,
      submissions_locked: locked,
      updated_at: new Date().toISOString(),
    })

  if (error) return { error: error.message }

  revalidatePath('/admin')
  revalidatePath('/dashboard')
  return { error: null }
}

export async function toggleScoresPublished(published: boolean) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const isAdmin = await checkIsAdmin(supabase, user)
  if (!isAdmin) {
    return { error: 'Unauthorized: Admin access required.' }
  }

  const { error } = await supabase
    .from('event_config')
    .upsert({
      id: 1,
      scores_published: published,
      updated_at: new Date().toISOString(),
    })

  if (error) return { error: error.message }

  revalidatePath('/admin')
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/results')
  return { error: null }
}

export async function toggleTeamFormationLock(locked: boolean) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const isAdmin = await checkIsAdmin(supabase, user)
  if (!isAdmin) {
    return { error: 'Unauthorized: Admin access required.' }
  }

  const { error } = await supabase.rpc('set_team_formation_lock', { p_locked: locked })
  if (error) return { error: error.message }

  revalidatePath('/admin')
  revalidatePath('/dashboard')
  return { error: null }
}

export async function unlockTeam(teamId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const isAdmin = await checkIsAdmin(supabase, user)
  if (!isAdmin) {
    return { error: 'Unauthorized: Admin access required.' }
  }

  const { error } = await supabase.rpc('unlock_team', { p_team_id: teamId })
  if (error) return { error: error.message }

  revalidatePath('/admin')
  return { error: null }
}

export async function scoreTeam(
  teamId: string,
  score: number | null,
  feedback: string | null
) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const isAdmin = await checkIsAdmin(supabase, user)
  if (!isAdmin) {
    return { error: 'Unauthorized: Admin access required.' }
  }

  const { error } = await supabase.rpc('score_team', {
    p_team_id: teamId,
    p_score: score,
    p_feedback: feedback,
  })

  if (error) return { error: error.message }

  revalidatePath('/admin')
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/results')
  return { error: null }
}

export async function updateParticipant(
  userId: string,
  data: { name: string; email: string; phone: string }
) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const isAdmin = await checkIsAdmin(supabase, user)
  if (!isAdmin) {
    return { error: 'Unauthorized: Admin access required.' }
  }

  const { error } = await supabase
    .from('profiles')
    .update(data)
    .eq('id', userId)

  if (error) return { error: error.message }

  revalidatePath('/admin')
  return { error: null }
}

export async function deleteParticipant(userId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const isAdmin = await checkIsAdmin(supabase, user)
  if (!isAdmin) {
    return { error: 'Unauthorized: Admin access required.' }
  }

  // 1. If this participant leads a team, that team's screenshot (submission
  // now lives on `teams`, not `profiles`) is about to be orphaned: deleting
  // this profile cascades (teams.leader_id ON DELETE CASCADE) to delete the
  // whole team row along with it. Clean up its storage file first.
  // Note: this cascade-deletes the team's submission/score too if they're
  // the leader — a pre-existing behavior, not fixed here.
  const { data: ledTeam } = await supabase
    .from('teams')
    .select('screenshot_url')
    .eq('leader_id', userId)
    .maybeSingle()

  if (ledTeam?.screenshot_url) {
    try {
      const parts = ledTeam.screenshot_url.split('/project_screenshots/')
      if (parts.length > 1) {
        const filePath = decodeURIComponent(parts[1])
        await supabase.storage.from('project_screenshots').remove([filePath])
      }
    } catch (storageErr) {
      console.error('Error removing team screenshot during user deletion:', storageErr)
    }
  }

  // 2. Call delete_user_completely RPC to purge user from auth.users
  // (which cascades to profiles, sessions, and identities)
  const { error: rpcError } = await supabase.rpc('delete_user_completely', {
    target_user_id: userId,
  })

  // Fallback: If RPC function isn't yet created or fails, delete from profiles directly
  if (rpcError) {
    console.warn('RPC delete_user_completely failed, falling back to profiles delete:', rpcError.message)
    const { error: profileDeleteError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId)

    if (profileDeleteError) return { error: profileDeleteError.message }
  }

  revalidatePath('/admin')
  return { error: null }
}

export async function promoteToAdmin(userId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const isAdmin = await checkIsAdmin(supabase, user)
  if (!isAdmin) {
    return { error: 'Unauthorized: Admin access required.' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({ role: 'admin' })
    .eq('id', userId)

  if (error) return { error: error.message }

  revalidatePath('/admin')
  return { error: null }
}
