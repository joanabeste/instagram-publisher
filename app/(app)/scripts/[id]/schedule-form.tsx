'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { schedulePostAction, type SchedulePostResult } from '../actions'

function Submit() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-10 items-center rounded-md bg-zinc-900 px-5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
    >
      {pending ? 'Plane…' : 'Post planen'}
    </button>
  )
}

function minDateTimeLocal(): string {
  const d = new Date(Date.now() + 2 * 60 * 1000)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const fieldClass =
  'h-10 rounded-md border border-zinc-200 bg-transparent px-3 text-sm outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-800 dark:focus:ring-zinc-100'

export function ScheduleForm({
  scriptId,
  existingVideoUrl,
}: {
  scriptId: string
  existingVideoUrl: string | null
}) {
  const [state, formAction] = useActionState<SchedulePostResult, FormData>(
    schedulePostAction,
    undefined,
  )

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="script_id" value={scriptId} />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="video_url" className="text-sm font-medium">
          Video-URL (HTTPS, MP4, öffentlich)
        </label>
        <input
          id="video_url"
          name="video_url"
          type="url"
          required
          defaultValue={existingVideoUrl ?? ''}
          placeholder="https://storage.example/reel.mp4"
          className={fieldClass}
        />
        <p className="text-xs text-zinc-500">
          Bis Phase 3b (Auto-Render) fertig ist: Video selbst erstellen, irgendwo öffentlich
          hochladen, URL hier rein.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="scheduled_for" className="text-sm font-medium">
          Zeitpunkt
        </label>
        <input
          id="scheduled_for"
          name="scheduled_for"
          type="datetime-local"
          required
          min={minDateTimeLocal()}
          className={fieldClass}
        />
      </div>

      {state && 'error' in state && (
        <p className="text-sm text-red-700 dark:text-red-300">{state.error}</p>
      )}

      <div className="flex justify-end">
        <Submit />
      </div>
    </form>
  )
}
