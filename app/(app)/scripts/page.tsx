import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { deleteScriptAction } from './actions'
import { ConfirmSubmit } from '@/components/confirm-submit'

export const metadata = { title: 'Skripte — ReelForge' }

const statusLabel: Record<string, string> = {
  draft: 'Entwurf',
  queued: 'In Queue',
  rendering: 'Rendert',
  rendered: 'Fertig',
  failed: 'Fehlgeschlagen',
}

export default async function ScriptsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: scripts } = await supabase
    .from('scripts')
    .select('id, hook_text, total_duration, render_status, created_at')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 md:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Skripte</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Alle Skripte, die Claude aus deinen Ideen generiert hat.
        </p>
      </div>

      {scripts && scripts.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {scripts.map((s) => (
            <li
              key={s.id}
              className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white p-4 transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-600"
            >
              <Link
                href={`/scripts/${s.id}`}
                className="flex flex-1 items-center justify-between gap-4"
              >
                <span className="text-sm font-medium">{s.hook_text}</span>
                <span className="shrink-0 text-xs text-zinc-500">
                  {s.total_duration ?? '?'}s · {statusLabel[s.render_status] ?? s.render_status}
                </span>
              </Link>
              <form action={deleteScriptAction} className="shrink-0">
                <input type="hidden" name="id" value={s.id} />
                <ConfirmSubmit
                  message="Dieses Skript und alle zugehörigen Posts löschen?"
                  className="inline-flex h-8 items-center rounded-md border border-transparent px-2 text-xs font-medium text-zinc-500 hover:border-red-200 hover:bg-red-50 hover:text-red-700 dark:hover:border-red-900/50 dark:hover:bg-red-900/20 dark:hover:text-red-300"
                >
                  Löschen
                </ConfirmSubmit>
              </form>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-10 text-center dark:border-zinc-700 dark:bg-zinc-900/50">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Noch keine Skripte. Öffne{' '}
            <Link href="/ideas" className="underline">
              Ideen
            </Link>{' '}
            und klick bei einer Idee auf „Skripten".
          </p>
        </div>
      )}
    </div>
  )
}
