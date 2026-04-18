'use client'

import { useActionState, useEffect } from 'react'
import { useFormStatus } from 'react-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { generateScriptAction, type GenerateScriptResult } from '../scripts/actions'

function Submit() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} size="sm">
      {pending ? 'Skripte…' : 'Skripten'}
    </Button>
  )
}

export function ScriptButton({ ideaId }: { ideaId: string }) {
  const [state, formAction] = useActionState<GenerateScriptResult, FormData>(
    (_prev, formData) => generateScriptAction(formData),
    undefined,
  )

  useEffect(() => {
    if (state && 'error' in state) toast.error(state.error)
  }, [state])

  return (
    <form action={formAction}>
      <input type="hidden" name="idea_id" value={ideaId} />
      <Submit />
    </form>
  )
}
