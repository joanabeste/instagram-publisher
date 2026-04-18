import Link from 'next/link'
import { deleteIdeaAction, updateIdeaStatusAction } from './actions'
import { ScriptButton } from './script-button'
import { ConfirmSubmit } from '@/components/confirm-submit'

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

const statusStyle: Record<Idea['status'], string> = {
  new: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200',
  scripted: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200',
  rejected: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
}

export function IdeaCard({ idea, scriptId }: { idea: Idea; scriptId?: string }) {
  const rawChips = [idea.hook_type, idea.format, idea.pillar].filter(Boolean) as string[]
  const chips = Array.from(new Set(rawChips))

  return (
    <article className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <header className="flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold leading-snug">{idea.hook}</h3>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${statusStyle[idea.status]}`}
        >
          {statusLabel[idea.status]}
        </span>
      </header>

      {idea.concept && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{idea.concept}</p>
      )}

      {chips.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {chips.map((chip) => (
            <li
              key={chip}
              className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[11px] text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
            >
              {chip}
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
              <button
                type="submit"
                className="inline-flex h-8 items-center rounded-md border border-zinc-200 px-3 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Verwerfen
              </button>
            </form>
          </>
        )}

        {idea.status === 'scripted' && scriptId && (
          <Link
            href={`/scripts/${scriptId}`}
            className="inline-flex h-8 items-center rounded-md bg-zinc-900 px-3 text-xs font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Skript öffnen →
          </Link>
        )}

        <form action={deleteIdeaAction} className="ml-auto">
          <input type="hidden" name="id" value={idea.id} />
          <ConfirmSubmit
            message="Diese Idee und alle zugehörigen Skripte/Posts löschen?"
            className="inline-flex h-8 items-center rounded-md border border-transparent px-2 text-xs font-medium text-zinc-500 hover:border-red-200 hover:bg-red-50 hover:text-red-700 dark:hover:border-red-900/50 dark:hover:bg-red-900/20 dark:hover:text-red-300"
          >
            Löschen
          </ConfirmSubmit>
        </form>
      </footer>
    </article>
  )
}
