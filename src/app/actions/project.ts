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

export async function submitProject(
  prevState: { error: string | null; success: boolean },
  formData: FormData
) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  // Check if submissions are locked
  const { data: config } = await supabase
    .from('event_config')
    .select('submissions_locked')
    .eq('id', 1)
    .maybeSingle()

  if (config?.submissions_locked) {
    return {
      error: 'Submissions have been locked by the event organizer. No changes can be submitted.',
      success: false,
    }
  }

  const description = formData.get('project_description') as string
  const deployLink = formData.get('deploy_link') as string
  const screenshotUrl = formData.get('screenshot_url') as string

  if (!description || !deployLink || !screenshotUrl) {
    return { error: 'All fields including screenshot are required.', success: false }
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      project_description: description,
      deploy_link: deployLink,
      screenshot_url: screenshotUrl,
    })
    .eq('id', user.id)

  if (error) {
    return { error: error.message, success: false }
  }

  revalidatePath('/dashboard')
  revalidatePath('/admin')
  return { error: null, success: true }
}

export async function revertSubmission() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  // Check if submissions are locked
  const { data: config } = await supabase
    .from('event_config')
    .select('submissions_locked')
    .eq('id', 1)
    .maybeSingle()

  if (config?.submissions_locked) {
    return { error: 'Submissions are locked. You cannot revert or modify your submission.' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      project_description: null,
      deploy_link: null,
      screenshot_url: null,
    })
    .eq('id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
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
  return { error: null }
}

export async function scoreSubmission(
  userId: string,
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

  const { error } = await supabase
    .from('profiles')
    .update({
      score,
      feedback: feedback ? feedback.trim() : null,
    })
    .eq('id', userId)

  if (error) return { error: error.message }

  revalidatePath('/admin')
  revalidatePath('/dashboard')
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

  // 1. Fetch profile to check if they have a screenshot uploaded
  const { data: targetProfile } = await supabase
    .from('profiles')
    .select('screenshot_url')
    .eq('id', userId)
    .maybeSingle()

  // If a screenshot was uploaded, delete it from storage bucket
  if (targetProfile?.screenshot_url) {
    try {
      const parts = targetProfile.screenshot_url.split('/project_screenshots/')
      if (parts.length > 1) {
        const filePath = decodeURIComponent(parts[1])
        await supabase.storage.from('project_screenshots').remove([filePath])
      }
    } catch (storageErr) {
      console.error('Error removing screenshot during user deletion:', storageErr)
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
