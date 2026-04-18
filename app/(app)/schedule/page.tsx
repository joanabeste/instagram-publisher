import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { cancelScheduledPostAction, deleteScheduledPostAction } from './actions'
import { PublishNowButton } from './publish-now-button'
import { ConfirmSubmit } from '@/components/confirm-submit'

export const metadata = { title: 'Posting-Queue — ReelForge' }

const STATUS_LABEL: Record<string, string> = {
  'pending-approval': 'Wartet auf Freigabe',
  approved: 'Geplant',
  posting: 'Wird gepostet',
  posted: 'Gepostet',
  failed: 'Fehlgeschlagen',
  canceled: 'Abgebrochen',
}

const STATUS_STYLE: Record<string, string> = {
  'pending-approval': 'bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200',
  approved: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200',
  posting: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-200',
  posted: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200',
  failed: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-200',
  canceled: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
}

const fmt = new Intl.DateTimeFormat('de-DE', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Europe/Berlin',
})

type Row = {
  id: string
  scheduled_for: string
  status: string
  ig_permalink: string | null
  post_error: string | null
  scripts: { id: string; hook_text: string } | null
  instagram_accounts: { ig_username: string | null; ig_user_id: string } | null
}

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ scheduled?: string }>
}) {
  const { scheduled } = await searchParams

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: postsRaw } = await supabase
    .from('scheduled_posts')
    .select(
      'id, scheduled_for, status, ig_permalink, post_error, scripts ( id, hook_text ), instagram_accounts ( ig_username, ig_user_id )',
    )
    .eq('user_id', user!.id)
    .order('scheduled_for', { ascending: true })

  const posts = (postsRaw ?? []) as unknown as Row[]

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 md:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Posting-Queue</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Geplante und gepostete Reels. Der Cron-Publisher (Phase 3c) nimmt automatisch alle Posts
          mit Status „Geplant" in der Vergangenheit.
        </p>
      </div>

      {scheduled && (
        <div className="mb-6 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200">
          Post in die Queue gelegt.
        </div>
      )}

      {posts.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {posts.map((p) => (
            <li
              key={p.id}
              className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[p.status] ?? ''}`}
                  >
                    {STATUS_LABEL[p.status] ?? p.status}
                  </span>
                  <span className="text-xs text-zinc-500">
                    {fmt.format(new Date(p.scheduled_for))}
                  </span>
                </div>
                {p.scripts ? (
                  <Link
                    href={`/scripts/${p.scripts.id}`}
                    className="mt-1 block truncate text-sm font-medium hover:underline"
                  >
                    {p.scripts.hook_text}
                  </Link>
                ) : (
                  <p className="mt-1 truncate text-sm italic text-zinc-500">
                    Skript gelöscht
                  </p>
                )}
                {p.instagram_accounts && (
                  <p className="text-xs text-zinc-500">
                    @{p.instagram_accounts.ig_username ?? p.instagram_accounts.ig_user_id}
                  </p>
                )}
                {p.post_error && (
                  <p className="mt-1 text-xs text-red-600">{p.post_error}</p>
                )}
              </div>

              <div className="flex shrink-0 flex-wrap items-start gap-2">
                {p.ig_permalink && (
                  <a
                    href={p.ig_permalink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-8 items-center rounded-md border border-zinc-200 px-3 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    Auf Instagram ansehen
                  </a>
                )}
                {(p.status === 'approved' || p.status === 'failed') && (
                  <PublishNowButton postId={p.id} />
                )}
                {(p.status === 'approved' || p.status === 'pending-approval') && (
                  <form action={cancelScheduledPostAction}>
                    <input type="hidden" name="id" value={p.id} />
                    <button
                      type="submit"
                      className="inline-flex h-8 items-center rounded-md border border-zinc-200 px-3 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    >
                      Abbrechen
                    </button>
                  </form>
                )}
                <form action={deleteScheduledPostAction}>
                  <input type="hidden" name="id" value={p.id} />
                  <ConfirmSubmit
                    message="Diesen Queue-Eintrag löschen?"
                    className="inline-flex h-8 items-center rounded-md border border-transparent px-2 text-xs font-medium text-zinc-500 hover:border-red-200 hover:bg-red-50 hover:text-red-700 dark:hover:border-red-900/50 dark:hover:bg-red-900/20 dark:hover:text-red-300"
                  >
                    Löschen
                  </ConfirmSubmit>
                </form>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-10 text-center dark:border-zinc-700 dark:bg-zinc-900/50">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Noch nichts geplant. Öffne ein{' '}
            <Link href="/scripts" className="underline">
              Skript
            </Link>{' '}
            und trage Video-URL + Zeitpunkt ein.
          </p>
        </div>
      )}
    </div>
  )
}
