import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { GenerateButton } from './generate-button'
import { IdeaCard } from './idea-card'

export const metadata = { title: 'Ideen — ReelForge' }

type Status = 'new' | 'scripted' | 'rejected'
const STATUSES: Status[] = ['new', 'scripted', 'rejected']
const STATUS_LABEL: Record<Status, string> = {
  new: 'Neu',
  scripted: 'Skripten',
  rejected: 'Verworfen',
}

export default async function IdeasPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status: statusParam } = await searchParams
  const activeStatus: Status = STATUSES.includes(statusParam as Status)
    ? (statusParam as Status)
    : 'new'

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [{ data: briefing }, { data: ideas }, { data: counts }, { data: scripts }] =
    await Promise.all([
      supabase
        .from('briefings')
        .select('id, brand_name')
        .eq('user_id', user!.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('ideas')
        .select('id, hook, concept, hook_type, format, pillar, status, created_at')
        .eq('user_id', user!.id)
        .eq('status', activeStatus)
        .order('created_at', { ascending: false }),
      supabase.from('ideas').select('status').eq('user_id', user!.id),
      supabase
        .from('scripts')
        .select('id, idea_id, created_at')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false }),
    ])

  const scriptByIdea = new Map<string, string>()
  for (const s of scripts ?? []) {
    if (!scriptByIdea.has(s.idea_id)) scriptByIdea.set(s.idea_id, s.id)
  }

  if (!briefing) {
    redirect('/onboarding')
  }

  const countByStatus = STATUSES.reduce<Record<Status, number>>(
    (acc, s) => {
      acc[s] = counts?.filter((i) => i.status === s).length ?? 0
      return acc
    },
    { new: 0, scripted: 0, rejected: 0 },
  )

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 md:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            {briefing.brand_name}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Ideen-Feed</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Claude generiert auf Basis deines Briefings. Skripten heißt: ab in die Render-Queue (Phase 3).
          </p>
        </div>
        <GenerateButton />
      </div>

      <nav className="mt-8 flex gap-1 border-b border-zinc-200 dark:border-zinc-800">
        {STATUSES.map((s) => {
          const isActive = s === activeStatus
          return (
            <Link
              key={s}
              href={s === 'new' ? '/ideas' : `/ideas?status=${s}`}
              className={`relative -mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100'
                  : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
              }`}
            >
              {STATUS_LABEL[s]}{' '}
              <span className="ml-1 text-xs text-zinc-400">{countByStatus[s]}</span>
            </Link>
          )
        })}
      </nav>

      {ideas && ideas.length > 0 ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ideas.map((idea) => (
            <IdeaCard key={idea.id} idea={idea} scriptId={scriptByIdea.get(idea.id)} />
          ))}
        </div>
      ) : (
        <div className="mt-10 rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-10 text-center dark:border-zinc-700 dark:bg-zinc-900/50">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {activeStatus === 'new'
              ? 'Noch keine Ideen. Klick oben rechts auf „8 Ideen generieren".'
              : `Keine Ideen im Status „${STATUS_LABEL[activeStatus]}".`}
          </p>
        </div>
      )}
    </div>
  )
}
