'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import Link from 'next/link'
import { signInAction, type AuthActionResult } from '../actions'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-10 w-full items-center justify-center rounded-md bg-zinc-900 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
    >
      {pending ? 'Anmelden…' : 'Anmelden'}
    </button>
  )
}

export function LoginForm({ next, registered }: { next?: string; registered?: boolean }) {
  const [state, formAction] = useActionState<AuthActionResult, FormData>(signInAction, undefined)

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {registered && (
        <div className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200">
          Account erstellt. Bitte einloggen.
        </div>
      )}

      {next && <input type="hidden" name="next" value={next} />}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium">E-Mail</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="h-10 rounded-md border border-zinc-200 bg-transparent px-3 text-sm outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-800 dark:focus:ring-zinc-100"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium">Passwort</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="h-10 rounded-md border border-zinc-200 bg-transparent px-3 text-sm outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-800 dark:focus:ring-zinc-100"
        />
      </div>

      {state?.error && (
        <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-900/30 dark:text-red-200">
          {state.error}
        </div>
      )}

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
