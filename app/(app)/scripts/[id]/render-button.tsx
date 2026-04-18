'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { renderVideoAction, type RenderVideoResult } from '../actions'

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-10 items-center rounded-md bg-zinc-900 px-5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
    >
      {pending ? 'Rendere… ~30 s' : label}
    </button>
  )
}

export function RenderButton({
  scriptId,
  label = 'Video rendern',
}: {
  scriptId: string
  label?: string
}) {
  const [state, formAction] = useActionState<RenderVideoResult, FormData>(
    (_prev, formData) => renderVideoAction(_prev, formData),
    undefined,
  )

  return (
    <form action={formAction} className="flex flex-col items-start gap-2">
      <input type="hidden" name="script_id" value={scriptId} />
      <Submit label={label} />
      {state && 'error' in state && (
        <p className="text-sm text-red-700 dark:text-red-300">{state.error}</p>
      )}
    </form>
  )
}
