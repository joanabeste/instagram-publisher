'use client'

import { useActionState, useEffect } from 'react'
import { useFormStatus } from 'react-dom'
import { toast } from 'sonner'
import { Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { publishNowAction, type PublishNowResult } from './actions'

function Submit() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} size="sm">
      <Send />
      {pending ? 'Poste… (bis 75 s)' : 'Jetzt posten'}
    </Button>
  )
}

export function PublishNowButton({ postId }: { postId: string }) {
  const [state, formAction] = useActionState<PublishNowResult, FormData>(
    publishNowAction,
    undefined,
  )

  useEffect(() => {
    if (!state) return
    if ('error' in state) toast.error(state.error)
    else if ('status' in state && state.status === 'posting')
      toast.info('Container läuft noch — Cron schließt ab.')
    else if ('status' in state && state.status === 'posted')
      toast.success('Gepostet.')
  }, [state])

  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={postId} />
      <Submit />
    </form>
  )
}
