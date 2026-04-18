'use client'

import { useActionState, useEffect } from 'react'
import { useFormStatus } from 'react-dom'
import Link from 'next/link'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { signUpAction, type AuthActionResult } from '../actions'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} size="lg" className="w-full">
      {pending ? 'Account anlegen…' : 'Account anlegen'}
    </Button>
  )
}

export function SignupForm() {
  const [state, formAction] = useActionState<AuthActionResult, FormData>(signUpAction, undefined)

  useEffect(() => {
    if (state?.error) toast.error(state.error)
  }, [state])

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="display_name">Name</Label>
        <Input id="display_name" name="display_name" type="text" autoComplete="name" />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">E-Mail</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Passwort</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
        />
        <p className="text-xs text-zinc-500 dark:text-zinc-400">Mindestens 8 Zeichen.</p>
      </div>

      <SubmitButton />

      <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
        Schon registriert?{' '}
        <Link href="/login" className="font-medium text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-100">
          Einloggen
        </Link>
      </p>
    </form>
  )
}
