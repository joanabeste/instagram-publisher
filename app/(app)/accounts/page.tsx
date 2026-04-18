import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { disconnectAccountAction } from './actions'

export const metadata = { title: 'Accounts — ReelForge' }

const ERROR_MESSAGES: Record<string, string> = {
  'meta-not-configured':
    'META_APP_ID / META_APP_SECRET fehlen in den Env-Variablen.',
  'state-mismatch': 'OAuth-State passt nicht — erneut versuchen.',
  'state-decode': 'OAuth-State korrupt — erneut versuchen.',
  'missing-params': 'Meta hat keine Autorisierung zurückgegeben.',
  'not-authenticated': 'Session abgelaufen — bitte erneut einloggen.',
  'no-pages': 'Keine Facebook-Page an deinem Account. Lege erst eine an.',
  'no-ig-account':
    'Keine deiner Facebook-Pages ist mit einem Instagram-Business-Account verknüpft.',
}

export default async function AccountsPage({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string; error?: string }>
}) {
  const { connected, error } = await searchParams

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [{ data: briefing }, { data: accounts }] = await Promise.all([
    supabase
      .from('briefings')
      .select('id, brand_name')
      .eq('user_id', user!.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('instagram_accounts')
      .select('id, ig_username, ig_user_id, fb_page_id, token_expires_at, is_active, created_at')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false }),
  ])

  if (!briefing) redirect('/onboarding')

  const errorMessage =
    error &&
    (ERROR_MESSAGES[error] ??
      (error.startsWith('api-error:')
        ? `Meta-API-Fehler: ${error.replace('api-error:', '')}`
        : error.startsWith('insert-failed:')
          ? `Speichern fehlgeschlagen: ${error.replace('insert-failed:', '')}`
          : `Fehler: ${error}`))

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Instagram-Accounts</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Verknüpfe einen Instagram-Business-Account (über die zugehörige Facebook-Page), damit
          ReelForge Reels veröffentlichen kann.
        </p>
      </div>

      {connected && (
        <div className="mb-6 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200">
          Account verknüpft.
        </div>
      )}
      {errorMessage && (
        <div className="mb-6 rounded-md bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-900/30 dark:text-red-200">
          {errorMessage}
        </div>
      )}

      <div className="mb-6 flex justify-end">
        <Link
          href="/auth/meta/start"
          className="inline-flex h-10 items-center rounded-md bg-zinc-900 px-5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Instagram verbinden
        </Link>
      </div>

      {accounts && accounts.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {accounts.map((a) => {
            const expiresSoon =
              a.token_expires_at &&
              new Date(a.token_expires_at).getTime() - Date.now() < 7 * 24 * 3600 * 1000
            return (
              <li
                key={a.id}
                className="flex items-center justify-between gap-4 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div>
                  <p className="text-sm font-semibold">
                    @{a.ig_username ?? a.ig_user_id}
                  </p>
                  <p className="text-xs text-zinc-500">
                    IG-ID {a.ig_user_id} · FB-Page {a.fb_page_id}
                    {a.token_expires_at && (
                      <>
                        {' · '}
                        <span className={expiresSoon ? 'text-amber-600' : ''}>
                          Token läuft {new Date(a.token_expires_at).toLocaleDateString('de-DE')} ab
                        </span>
                      </>
                    )}
                  </p>
                </div>
                <form action={disconnectAccountAction}>
                  <input type="hidden" name="id" value={a.id} />
                  <button
                    type="submit"
                    className="inline-flex h-8 items-center rounded-md border border-zinc-200 px-3 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    Trennen
                  </button>
                </form>
              </li>
            )
          })}
        </ul>
      ) : (
        <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-10 text-center dark:border-zinc-700 dark:bg-zinc-900/50">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Noch kein Account verknüpft. Klick oben auf „Instagram verbinden".
          </p>
        </div>
      )}

      <details className="mt-10 text-xs text-zinc-500">
        <summary className="cursor-pointer">Setup-Hinweis für die Meta-App</summary>
        <div className="mt-3 space-y-2 leading-relaxed">
          <p>
            Erstelle im{' '}
            <a
              href="https://developers.facebook.com/apps"
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              Meta Developer Dashboard
            </a>{' '}
            eine App vom Typ „Business". Füge das Produkt „Instagram Graph API" hinzu.
          </p>
          <p>
            Unter „Facebook Login for Business" → „Settings" die Redirect-URI{' '}
            <code className="rounded bg-zinc-200 px-1 py-0.5 dark:bg-zinc-800">
              {process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/auth/meta/callback
            </code>{' '}
            hinterlegen.
          </p>
          <p>
            App-ID + App-Secret in <code>.env.local</code> als{' '}
            <code>META_APP_ID</code> / <code>META_APP_SECRET</code> eintragen, dann Dev-Server neu
            starten.
          </p>
          <p>
            Der verknüpfte Instagram-Account muss ein Business- oder Creator-Account sein UND mit
            einer Facebook-Page verbunden sein.
          </p>
        </div>
      </details>
    </div>
  )
}
