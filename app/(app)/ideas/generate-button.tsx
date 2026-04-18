'use client'

import { useActionState, useEffect } from 'react'
import { useFormStatus } from 'react-dom'
import { toast } from 'sonner'
import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { generateIdeasAction, type GenerateIdeasResult } from './actions'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} size="lg">
      <Sparkles />
      {pending ? 'Claude denkt nach…' : '8 Ideen generieren'}
    </Button>
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

  useEffect(() => {
    if (!state) return
    if ('error' in state) toast.error(state.error)
    if ('created' in state) toast.success(`${state.created} neue Ideen erstellt.`)
  }, [state])

  return (
    <form action={formAction}>
      <SubmitButton />
    </form>
  )
}
