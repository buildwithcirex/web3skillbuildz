'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function signUp(
  prevState: { error: string; success: boolean },
  formData: FormData
) {
  const supabase = await createClient()

  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const phone = formData.get('phone') as string
  const password = formData.get('password') as string

  if (!name || !email || !phone || !password) {
    return { error: 'All fields are required.', success: false }
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name, phone },
    },
  })

  if (error) {
    return { error: error.message, success: false }
  }

  // If session exists immediately (email confirmation disabled), redirect
  if (data.session) {
    revalidatePath('/', 'layout')
    redirect('/dashboard')
  }

  // Email confirmation is enabled — tell the user to check their email
  return { error: '', success: true }
}

export async function signInWithMagicLink(
  prevState: { error: string; success: boolean },
  formData: FormData
) {
  const supabase = await createClient()
  const email = formData.get('email') as string

  if (!email) {
    return { error: 'Email is required.', success: false }
  }

  if (!email.toLowerCase().includes('@kccemsr.edu.in')) {
    return { error: 'Please use your college email address.', success: false }
  }

  // Next.js headers API can sometimes be tricky for getting full origin depending on proxy, 
  // but let's use the local URL for dev or process.env for prod
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback`,
    },
  })

  if (error) {
    // If the database trigger rejects the signup, the error message will be surfaced here!
    return { error: error.message, success: false }
  }

  return { error: '', success: true, timestamp: Date.now() }
}

export async function signIn(
  prevState: { error: string; success: boolean },
  formData: FormData
) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email and password are required.', success: false }
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: error.message, success: false }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/')
}
