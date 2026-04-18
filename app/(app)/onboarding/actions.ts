'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

export type OnboardingActionResult = { error: string } | void

const schema = z.object({
  brand_name: z.string().trim().min(1, 'Bitte Brand-Namen angeben.').max(80),
  niche: z.string().trim().min(1, 'Bitte Nische angeben.').max(120),
  audience: z.string().trim().min(1, 'Bitte Zielgruppe beschreiben.').max(280),
  tone: z.string().trim().min(1, 'Bitte Tonalität wählen.').max(80),
  content_pillars: z
    .string()
    .optional()
    .transform((v) =>
      (v ?? '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 8),
    ),
  visual_style: z.string().trim().max(120).optional().or(z.literal('')),
  music_vibe: z.string().trim().max(80).optional().or(z.literal('')),
  frequency: z.enum(['daily', '3x-week', '2x-week', 'weekly']),
  video_length_sec: z.coerce.number().int().min(10).max(60),
})

export async function createBriefingAction(
  _prev: OnboardingActionResult,
  formData: FormData,
): Promise<OnboardingActionResult> {
  const parsed = schema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Ungültige Eingabe.' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Nicht eingeloggt.' }

  const d = parsed.data
  const { error: insertError } = await supabase.from('briefings').insert({
    user_id: user.id,
    brand_name: d.brand_name,
    niche: d.niche,
    audience: d.audience,
    tone: d.tone,
    content_pillars: d.content_pillars,
    visual_style: d.visual_style || null,
    music_vibe: d.music_vibe || null,
    frequency: d.frequency,
    video_length_sec: d.video_length_sec,
  })

  if (insertError) {
    return { error: `Briefing speichern fehlgeschlagen: ${insertError.message}` }
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ onboarding_done: true })
    .eq('user_id', user.id)

  if (profileError) {
    return { error: `Profil-Update fehlgeschlagen: ${profileError.message}` }
  }

  redirect('/dashboard')
}
