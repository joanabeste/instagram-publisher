import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export const metadata = { title: 'Dashboard — ReelForge' }

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [{ data: profile }, { data: briefing }] = await Promise.all([
    supabase
      .from('profiles')
      .select('display_name, plan, onboarding_done')
      .eq('user_id', user!.id)
      .maybeSingle(),
    supabase
      .from('briefings')
      .select('brand_name, niche, frequency, video_length_sec, content_pillars, is_active')
      .eq('user_id', user!.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  if (!profile?.onboarding_done) {
    redirect('/onboarding')
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:px-6">
      <h1 className="text-2xl font-semibold tracking-tight">
        Hi {profile.display_name ?? user!.email?.split('@')[0]} 👋
      </h1>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Phase 1 abgeschlossen. Ideen-Feed und Render-Pipeline folgen in Phase 2 & 3.
      </p>

      <dl className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Plan</dt>
          <dd className="mt-1 text-lg font-semibold">{profile.plan}</dd>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Frequenz</dt>
          <dd className="mt-1 text-lg font-semibold">{briefing?.frequency ?? '—'}</dd>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Video-Länge</dt>
          <dd className="mt-1 text-lg font-semibold">
            {briefing ? `${briefing.video_length_sec}s` : '—'}
          </dd>
        </div>
      </dl>

      {briefing && (
        <section className="mt-8 rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
                Aktives Briefing
              </h2>
              <p className="mt-3 text-lg font-semibold">{briefing.brand_name}</p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">{briefing.niche}</p>
            </div>
            <Link
              href="/ideas"
              className="inline-flex h-9 shrink-0 items-center rounded-md bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Ideen ansehen →
            </Link>
          </div>
          {briefing.content_pillars.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-2">
              {briefing.content_pillars.map((pillar) => (
                <li
                  key={pillar}
                  className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                >
                  {pillar}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  )
}
