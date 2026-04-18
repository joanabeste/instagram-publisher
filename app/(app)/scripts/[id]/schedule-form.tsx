'use client'

import { useActionState, useEffect, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { toast } from 'sonner'
import { CalendarClock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { schedulePostAction, type SchedulePostResult } from '../actions'

function Submit() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} size="lg">
      <CalendarClock />
      {pending ? 'Plane…' : 'Post planen'}
    </Button>
  )
}

function minDateTimeLocal(): string {
  const d = new Date(Date.now() + 2 * 60 * 1000)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

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
  const [videoUrl, setVideoUrl] = useState(existingVideoUrl ?? '')

  useEffect(() => {
    if (state && 'error' in state) toast.error(state.error)
  }, [state])

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="script_id" value={scriptId} />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="video_url">Video-URL (HTTPS, MP4, öffentlich)</Label>
        <Input
          id="video_url"
          name="video_url"
          type="url"
          required
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          placeholder="https://storage.example/reel.mp4"
        />
        <p className="text-xs text-zinc-500">
          Bis Phase 3b (Auto-Render) fertig ist: Video selbst erstellen, irgendwo öffentlich
          hochladen, URL hier rein.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="scheduled_for">Zeitpunkt</Label>
        <Input
          id="scheduled_for"
          name="scheduled_for"
          type="datetime-local"
          required
          min={minDateTimeLocal()}
        />
      </div>

      <div className="flex justify-end">
        <Submit />
      </div>
    </form>
  )
}
