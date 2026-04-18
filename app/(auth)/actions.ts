'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export type AuthActionResult = { error: string } | void

export async function signInAction(
  _prev: AuthActionResult,
  formData: FormData,
): Promise<AuthActionResult> {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  const next = String(formData.get('next') ?? '/dashboard')

  if (!email || !password) {
    return { error: 'E-Mail und Passwort sind erforderlich.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: error.message }
  }

  redirect(next.startsWith('/') ? next : '/dashboard')
}

export async function signUpAction(
  _prev: AuthActionResult,
  formData: FormData,
): Promise<AuthActionResult> {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  const displayName = String(formData.get('display_name') ?? '').trim()

  if (!email || !password) {
    return { error: 'E-Mail und Passwort sind erforderlich.' }
  }
  if (password.length < 8) {
    return { error: 'Passwort muss mindestens 8 Zeichen haben.' }
  }

  const supabase = await createClient()
  const { error, data } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: displayName ? { display_name: displayName } : undefined,
    },
  })

  if (error) {
    return { error: error.message }
  }

  // If email confirmations are disabled (default in local dev), session is active.
  if (data.session) {
    redirect('/dashboard')
  }

  redirect('/login?registered=1')
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
