'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { updateBriefingAction, type UpdateBriefingResult } from './actions'

type InitialValues = {
  brand_name: string
  niche: string
  audience: string
  tone: string
  language: string
  content_pillars: string[]
  visual_style: string | null
  music_vibe: string | null
  video_length_sec: number
  frequency: 'daily' | '3x-week' | '2x-week' | 'weekly'
  post_times: string[]
  timezone: string
  auto_post: boolean
  is_active: boolean
}

function Save() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-10 items-center rounded-md bg-zinc-900 px-5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
    >
      {pending ? 'Speichere…' : 'Änderungen speichern'}
    </button>
  )
}

const fieldClass =
  'h-10 rounded-md border border-zinc-200 bg-transparent px-3 text-sm outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-800 dark:focus:ring-zinc-100'
const textareaClass =
  'min-h-20 rounded-md border border-zinc-200 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-800 dark:focus:ring-zinc-100'

export function BriefingForm({ initial }: { initial: InitialValues }) {
  const [state, formAction] = useActionState<UpdateBriefingResult, FormData>(
    updateBriefingAction,
    undefined,
  )

  return (
    <form action={formAction} className="flex flex-col gap-8">
      <section className="flex flex-col gap-4">
        <header>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Brand</h2>
        </header>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="brand_name" className="text-sm font-medium">Brand-Name</label>
            <input
              id="brand_name"
              name="brand_name"
              required
              maxLength={80}
              defaultValue={initial.brand_name}
              className={fieldClass}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="niche" className="text-sm font-medium">Nische</label>
            <input
              id="niche"
              name="niche"
              required
              maxLength={120}
              defaultValue={initial.niche}
              className={fieldClass}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="audience" className="text-sm font-medium">Zielgruppe</label>
          <textarea
            id="audience"
            name="audience"
            required
            maxLength={280}
            rows={2}
            defaultValue={initial.audience}
            className={textareaClass}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="tone" className="text-sm font-medium">Tonalität</label>
            <input
              id="tone"
              name="tone"
              required
              maxLength={80}
              defaultValue={initial.tone}
              className={fieldClass}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="language" className="text-sm font-medium">Sprache</label>
            <input
              id="language"
              name="language"
              required
              maxLength={10}
              defaultValue={initial.language}
              placeholder="de"
              className={fieldClass}
            />
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4 border-t border-zinc-200 pt-8 dark:border-zinc-800">
        <header>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Inhalt</h2>
        </header>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="content_pillars" className="text-sm font-medium">
            Content-Säulen <span className="text-zinc-500">(kommagetrennt)</span>
          </label>
          <input
            id="content_pillars"
            name="content_pillars"
            defaultValue={initial.content_pillars.join(', ')}
            className={fieldClass}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="visual_style" className="text-sm font-medium">Visueller Stil</label>
            <input
              id="visual_style"
              name="visual_style"
              maxLength={120}
              defaultValue={initial.visual_style ?? ''}
              className={fieldClass}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="music_vibe" className="text-sm font-medium">Music-Vibe</label>
            <input
              id="music_vibe"
              name="music_vibe"
              maxLength={80}
              defaultValue={initial.music_vibe ?? ''}
              className={fieldClass}
            />
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4 border-t border-zinc-200 pt-8 dark:border-zinc-800">
        <header>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Takt</h2>
        </header>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="frequency" className="text-sm font-medium">Frequenz</label>
            <select
              id="frequency"
              name="frequency"
              defaultValue={initial.frequency}
              className={fieldClass}
            >
              <option value="daily">Täglich</option>
              <option value="3x-week">3×/Woche</option>
              <option value="2x-week">2×/Woche</option>
              <option value="weekly">Wöchentlich</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="video_length_sec" className="text-sm font-medium">Länge (s)</label>
            <input
              id="video_length_sec"
              name="video_length_sec"
              type="number"
              min={10}
              max={60}
              defaultValue={initial.video_length_sec}
              className={fieldClass}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="timezone" className="text-sm font-medium">Timezone</label>
            <input
              id="timezone"
              name="timezone"
              defaultValue={initial.timezone}
              list="tz-options"
              className={fieldClass}
            />
            <datalist id="tz-options">
              <option value="Europe/Berlin" />
              <option value="Europe/Vienna" />
              <option value="Europe/Zurich" />
              <option value="UTC" />
              <option value="America/New_York" />
              <option value="America/Los_Angeles" />
            </datalist>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="post_times" className="text-sm font-medium">
            Posting-Zeiten <span className="text-zinc-500">(HH:MM, kommagetrennt)</span>
          </label>
          <input
            id="post_times"
            name="post_times"
            defaultValue={initial.post_times.join(', ')}
            placeholder="18:00, 20:30"
            className={fieldClass}
          />
        </div>
      </section>

      <section className="flex flex-col gap-4 border-t border-zinc-200 pt-8 dark:border-zinc-800">
        <header>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Automatisierung
          </h2>
        </header>

        <label className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            name="auto_post"
            defaultChecked={initial.auto_post}
            className="h-4 w-4"
          />
          <span>
            <span className="font-medium">Auto-Post</span> — fertige Reels ohne Freigabe posten
          </span>
        </label>

        <label className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            name="is_active"
            defaultChecked={initial.is_active}
            className="h-4 w-4"
          />
          <span>
            <span className="font-medium">Briefing aktiv</span> — Deaktivieren pausiert Ideen- und Script-Generierung
          </span>
        </label>
      </section>

      {state && 'error' in state && (
        <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-900/30 dark:text-red-200">
          {state.error}
        </div>
      )}
      {state && 'saved' in state && (
        <div className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200">
          Gespeichert.
        </div>
      )}

      <div className="flex justify-end">
        <Save />
      </div>
    </form>
  )
}
