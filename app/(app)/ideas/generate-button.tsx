'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { generateIdeasAction, type GenerateIdeasResult } from './actions'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-10 items-center justify-center rounded-md bg-zinc-900 px-5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
    >
      {pending ? 'Claude denkt nach…' : '8 Ideen generieren'}
    </button>
  )
}

async function wrappedAction(
  _prev: GenerateIdeasResult | undefined,
): Promise<GenerateIdeasResult> {
  return generateIdeasAction()
}

export function GenerateButton() {
  const [state, formAction] = useActionState<GenerateIdeasResult | undefined>(
    wrappedAction,
    undefined,
  )

  return (
    <form action={formAction} className="flex flex-col items-end gap-2">
      <SubmitButton />
      {state && 'error' in state && (
        <p className="text-sm text-red-700 dark:text-red-300">{state.error}</p>
      )}
      {state && 'created' in state && (
        <p className="text-sm text-emerald-700 dark:text-emerald-300">
          {state.created} neue Ideen erstellt.
        </p>
      )}
    </form>
  )
}
