import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ScheduleForm } from './schedule-form'
import { RenderButton } from './render-button'
import { deleteScriptAction } from '../actions'
import { ConfirmSubmit } from '@/components/confirm-submit'

export const metadata = { title: 'Skript — ReelForge' }

type Segment = {
  order: number
  duration_sec: number
  voiceover: string
  on_screen_text?: string
  b_roll_hint: string
}

function isSegmentArray(value: unknown): value is Segment[] {
  return (
    Array.isArray(value) &&
    value.every(
      (s) =>
        typeof s === 'object' &&
        s !== null &&
        typeof (s as Segment).order === 'number' &&
        typeof (s as Segment).duration_sec === 'number' &&
        typeof (s as Segment).voiceover === 'string' &&
        typeof (s as Segment).b_roll_hint === 'string',
    )
  )
}

export default async function ScriptPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: script } = await supabase
    .from('scripts')
    .select(
      'id, hook_text, segments, caption, hashtags, cta, total_duration, render_status, render_error, video_url, created_at, idea_id',
    )
    .eq('id', id)
    .eq('user_id', user!.id)
    .maybeSingle()

  if (!script) notFound()

  const segments = isSegmentArray(script.segments) ? [...script.segments] : []
  segments.sort((a, b) => a.order - b.order)

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:px-6">
      <nav className="mb-6 text-sm">
        <Link href="/ideas" className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
          ← Zurück zu den Ideen
        </Link>
      </nav>

      <header className="flex flex-wrap items-start justify-between gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">{script.hook_text}</h1>
        <div className="flex shrink-0 items-center gap-3">
          <span className="text-sm text-zinc-500">
            {script.total_duration ?? '?'}s · Status: {script.render_status}
          </span>
          <form action={deleteScriptAction}>
            <input type="hidden" name="id" value={script.id} />
            <ConfirmSubmit
              message="Dieses Skript und alle zugehörigen Posts löschen?"
              className="inline-flex h-8 items-center rounded-md border border-transparent px-2 text-xs font-medium text-zinc-500 hover:border-red-200 hover:bg-red-50 hover:text-red-700 dark:hover:border-red-900/50 dark:hover:bg-red-900/20 dark:hover:text-red-300"
            >
              Löschen
            </ConfirmSubmit>
          </form>
        </div>
      </header>

      <section className="mt-8">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Timeline</h2>
        <ol className="mt-3 flex flex-col gap-3">
          {segments.map((seg) => (
            <li
              key={seg.order}
              className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Segment {seg.order}
                </span>
                <span className="text-xs text-zinc-500">{seg.duration_sec}s</span>
              </div>
              <p className="mt-2 text-sm font-medium">{seg.voiceover}</p>
              {seg.on_screen_text && (
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  <span className="font-medium text-zinc-500">On-Screen: </span>
                  {seg.on_screen_text}
                </p>
              )}
              <p className="mt-1 text-sm text-zinc-500">
                <span className="font-medium">B-Roll: </span>
                {seg.b_roll_hint}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-8 rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Caption</h2>
        <p className="mt-3 whitespace-pre-line text-sm">{script.caption}</p>
        <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
          <span className="font-medium text-zinc-500">CTA: </span>
          {script.cta}
        </p>
        {script.hashtags.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-1.5">
            {script.hashtags.map((tag) => (
              <li
                key={tag}
                className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-xs text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
              >
                #{tag}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8 rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Video
        </h2>
        {script.render_status === 'rendered' && script.video_url ? (
          <div className="mt-3 space-y-3">
            <video
              src={script.video_url}
              controls
              playsInline
              className="aspect-[9/16] w-full max-w-xs rounded-md bg-black"
            />
            <div className="flex items-center gap-3">
              <a
                href={script.video_url}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-zinc-500 underline"
              >
                MP4 öffnen
              </a>
              <RenderButton scriptId={script.id} label="Neu rendern" />
            </div>
          </div>
        ) : script.render_status === 'rendering' ? (
          <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
            FFmpeg rendert gerade. Bei ~{script.total_duration ?? 20} s Output typisch 20–40 s.
            Seite neu laden, um den Status zu aktualisieren.
          </p>
        ) : (
          <div className="mt-3 space-y-3">
            {script.render_status === 'failed' && script.render_error && (
              <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-900/30 dark:text-red-200">
                Letzter Render schlug fehl: {script.render_error}
              </div>
            )}
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Stummes 9:16-Reel aus Pexels-B-Roll + On-Screen-Text.
            </p>
            <RenderButton scriptId={script.id} />
          </div>
        )}
      </section>

      <section className="mt-8 rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Post planen
        </h2>
        <p className="mt-1 mb-4 text-sm text-zinc-600 dark:text-zinc-400">
          Video-URL + Zeitpunkt → landet in der Posting-Queue.
        </p>
        <ScheduleForm scriptId={script.id} existingVideoUrl={script.video_url} />
      </section>

      <p className="mt-6 text-xs text-zinc-500">
        Auto-Render-Pipeline (Remotion) kommt in Phase 3b. Der Cron-Publisher, der an Instagram
        postet, folgt als Phase 3c.
      </p>
    </div>
  )
}
