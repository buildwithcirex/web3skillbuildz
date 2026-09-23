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
