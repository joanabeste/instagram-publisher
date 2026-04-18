'use client'

import { useActionState, useEffect } from 'react'
import { useFormStatus } from 'react-dom'
import { toast } from 'sonner'
import { Video } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { renderVideoAction, type RenderVideoResult } from '../actions'

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} size="lg">
      <Video />
      {pending ? 'Rendere… ~30 s' : label}
    </Button>
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

  useEffect(() => {
    if (state && 'error' in state) toast.error(state.error)
  }, [state])

  return (
    <form action={formAction}>
      <input type="hidden" name="script_id" value={scriptId} />
      <Submit label={label} />
    </form>
  )
}
