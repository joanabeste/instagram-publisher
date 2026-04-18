import Link from 'next/link'
import { Trash2 } from 'lucide-react'
import { deleteIdeaAction, updateIdeaStatusAction } from './actions'
import { ScriptButton } from './script-button'
import { ConfirmSubmit } from '@/components/confirm-submit'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Idea = {
  id: string
  hook: string
  concept: string | null
  hook_type: string | null
  format: string | null
  pillar: string | null
  status: 'new' | 'scripted' | 'rejected'
  created_at: string
}

const statusLabel: Record<Idea['status'], string> = {
  new: 'Neu',
  scripted: 'Skripten',
  rejected: 'Verworfen',
}

const statusVariant: Record<Idea['status'], 'default' | 'success' | 'muted'> = {
  new: 'default',
  scripted: 'success',
  rejected: 'muted',
}

export function IdeaCard({ idea, scriptId }: { idea: Idea; scriptId?: string }) {
  const rawChips = [idea.hook_type, idea.format, idea.pillar].filter(Boolean) as string[]
  const chips = Array.from(new Set(rawChips))

  return (
    <article className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <header className="flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold leading-snug">{idea.hook}</h3>
        <Badge variant={statusVariant[idea.status]} className="shrink-0">
          {statusLabel[idea.status]}
        </Badge>
      </header>

      {idea.concept && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{idea.concept}</p>
      )}

      {chips.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {chips.map((chip) => (
            <li key={chip}>
              <Badge variant="outline">{chip}</Badge>
            </li>
          ))}
        </ul>
      )}

      <footer className="mt-1 flex flex-wrap items-start gap-2">
        {idea.status === 'new' && (
          <>
            <ScriptButton ideaId={idea.id} />
            <form action={updateIdeaStatusAction}>
              <input type="hidden" name="id" value={idea.id} />
              <input type="hidden" name="status" value="rejected" />
              <Button type="submit" variant="outline" size="sm">
                Verwerfen
              </Button>
            </form>
          </>
        )}

        {idea.status === 'scripted' && scriptId && (
          <Link
            href={`/scripts/${scriptId}`}
            className={cn(buttonVariants({ size: 'sm' }))}
          >
            Skript öffnen →
          </Link>
        )}

        <form action={deleteIdeaAction} className="ml-auto">
          <input type="hidden" name="id" value={idea.id} />
          <ConfirmSubmit
            message="Diese Idee und alle zugehörigen Skripte/Posts löschen?"
            className={cn(
              buttonVariants({ variant: 'ghost', size: 'sm' }),
              'text-zinc-500 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900/20 dark:hover:text-red-300',
            )}
          >
            <Trash2 />
            Löschen
          </ConfirmSubmit>
        </form>
      </footer>
    </article>
  )
}
