'use client'

import { useActionState, useEffect } from 'react'
import { useFormStatus } from 'react-dom'
import Link from 'next/link'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { signInAction, type AuthActionResult } from '../actions'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} size="lg" className="w-full">
      {pending ? 'Anmelden…' : 'Anmelden'}
    </Button>
  )
}

export function LoginForm({ next, registered }: { next?: string; registered?: boolean }) {
  const [state, formAction] = useActionState<AuthActionResult, FormData>(signInAction, undefined)

  useEffect(() => {
    if (registered) toast.success('Account erstellt. Bitte einloggen.')
  }, [registered])

  useEffect(() => {
    if (state?.error) toast.error(state.error)
  }, [state])

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {next && <input type="hidden" name="next" value={next} />}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">E-Mail</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Passwort</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>

      <SubmitButton />

      <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
        Noch keinen Account?{' '}
        <Link href="/signup" className="font-medium text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-100">
          Registrieren
        </Link>
      </p>
    </form>
  )
}
