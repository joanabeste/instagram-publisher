'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { createBriefingAction, type OnboardingActionResult } from './actions'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-10 items-center justify-center rounded-md bg-zinc-900 px-5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
    >
      {pending ? 'Speichere…' : 'Onboarding abschließen'}
    </button>
  )
}

const fieldClass =
  'h-10 rounded-md border border-zinc-200 bg-transparent px-3 text-sm outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-800 dark:focus:ring-zinc-100'
const textareaClass =
  'min-h-20 rounded-md border border-zinc-200 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-800 dark:focus:ring-zinc-100'

export function OnboardingForm() {
  const [state, formAction] = useActionState<OnboardingActionResult, FormData>(
    createBriefingAction,
    undefined,
  )

  return (
    <form action={formAction} className="flex flex-col gap-8">
      <section className="flex flex-col gap-4">
        <header>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Brand
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Wer bist du und für wen postest du?
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="brand_name" className="text-sm font-medium">Brand-Name</label>
            <input id="brand_name" name="brand_name" required maxLength={80} className={fieldClass} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="niche" className="text-sm font-medium">Nische</label>
            <input
              id="niche"
              name="niche"
              required
              maxLength={120}
              placeholder="z. B. Finanz-Coaching, Home-Workouts"
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
            placeholder="z. B. 25–40-jährige Angestellte, die zum ersten Mal investieren wollen"
            className={textareaClass}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="tone" className="text-sm font-medium">Tonalität</label>
          <input
            id="tone"
            name="tone"
            required
            maxLength={80}
            placeholder="z. B. direkt, motivierend, mit Humor"
            className={fieldClass}
          />
        </div>
      </section>

      <section className="flex flex-col gap-4 border-t border-zinc-200 pt-8 dark:border-zinc-800">
        <header>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Inhalt
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Themen und Stil. Optional — du kannst das später verfeinern.
          </p>
        </header>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="content_pillars" className="text-sm font-medium">
            Content-Säulen <span className="text-zinc-500">(kommagetrennt, max. 8)</span>
          </label>
          <input
            id="content_pillars"
            name="content_pillars"
            placeholder="z. B. Mindset, Tools, Case Studies, Hot Takes"
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
              placeholder="z. B. minimal, Pastell, hart geschnitten"
              className={fieldClass}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="music_vibe" className="text-sm font-medium">Music-Vibe</label>
            <input
              id="music_vibe"
              name="music_vibe"
              maxLength={80}
              placeholder="z. B. upbeat electronic, lo-fi"
              className={fieldClass}
            />
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4 border-t border-zinc-200 pt-8 dark:border-zinc-800">
        <header>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Takt
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Wie oft und wie lang? Posting-Zeiten justieren wir später.
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="frequency" className="text-sm font-medium">Frequenz</label>
            <select id="frequency" name="frequency" defaultValue="daily" className={fieldClass}>
              <option value="daily">Täglich</option>
              <option value="3x-week">3×/Woche</option>
              <option value="2x-week">2×/Woche</option>
              <option value="weekly">Wöchentlich</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="video_length_sec" className="text-sm font-medium">
              Videolänge (Sekunden)
            </label>
            <input
              id="video_length_sec"
              name="video_length_sec"
              type="number"
              min={10}
              max={60}
              defaultValue={20}
              className={fieldClass}
            />
          </div>
        </div>
      </section>

      {state?.error && (
        <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-900/30 dark:text-red-200">
          {state.error}
        </div>
      )}

      <div className="flex justify-end">
        <SubmitButton />
      </div>
    </form>
  )
}
