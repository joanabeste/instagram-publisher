'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { generateScriptAction, type GenerateScriptResult } from '../scripts/actions'

function Submit() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-8 items-center rounded-md bg-zinc-900 px-3 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
    >
      {pending ? 'Skripte…' : 'Skripten'}
    </button>
  )
}

export function ScriptButton({ ideaId }: { ideaId: string }) {
  const [state, formAction] = useActionState<GenerateScriptResult, FormData>(
    (_prev, formData) => generateScriptAction(formData),
    undefined,
  )

  return (
    <form action={formAction} className="flex flex-col gap-1">
      <input type="hidden" name="idea_id" value={ideaId} />
      <Submit />
      {state && 'error' in state && (
        <p className="text-xs text-red-700 dark:text-red-300">{state.error}</p>
      )}
    </form>
  )
}
