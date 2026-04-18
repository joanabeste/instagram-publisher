'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { publishNowAction, type PublishNowResult } from './actions'

function Submit() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-8 items-center rounded-md bg-zinc-900 px-3 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
    >
      {pending ? 'Poste… (bis 75 s)' : 'Jetzt posten'}
    </button>
  )
}

export function PublishNowButton({ postId }: { postId: string }) {
  const [state, formAction] = useActionState<PublishNowResult, FormData>(
    publishNowAction,
    undefined,
  )

  return (
    <form action={formAction} className="flex flex-col items-end gap-1">
      <input type="hidden" name="id" value={postId} />
      <Submit />
      {state && 'error' in state && (
        <p className="text-xs text-red-700 dark:text-red-300">{state.error}</p>
      )}
      {state && 'status' in state && state.status === 'posting' && (
        <p className="text-xs text-zinc-500">
          Container läuft noch — Cron schließt ab.
        </p>
      )}
    </form>
  )
}
