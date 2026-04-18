'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

export type UpdateBriefingResult = { error: string } | { saved: true } | undefined

const timeRe = /^([01]?\d|2[0-3]):[0-5]\d$/

const schema = z.object({
  brand_name: z.string().trim().min(1).max(80),
  niche: z.string().trim().min(1).max(120),
  audience: z.string().trim().min(1).max(280),
  tone: z.string().trim().min(1).max(80),
  language: z.string().trim().min(2).max(10),
  content_pillars: z
    .string()
    .optional()
    .transform((v) =>
      (v ?? '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 12),
    ),
  visual_style: z.string().trim().max(120).optional(),
  music_vibe: z.string().trim().max(80).optional(),
  video_length_sec: z.coerce.number().int().min(10).max(60),
  frequency: z.enum(['daily', '3x-week', '2x-week', 'weekly']),
  post_times: z
    .string()
    .transform((v) =>
      v
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    )
    .refine((arr) => arr.length > 0 && arr.every((t) => timeRe.test(t)), {
      message: 'Post-Times müssen im Format HH:MM sein (kommagetrennt).',
    }),
  timezone: z.string().trim().min(1).max(64),
  auto_post: z.preprocess((v) => v === 'on' || v === 'true' || v === true, z.boolean()),
  is_active: z.preprocess((v) => v === 'on' || v === 'true' || v === true, z.boolean()),
})

export async function updateBriefingAction(
  _prev: UpdateBriefingResult,
  formData: FormData,
): Promise<UpdateBriefingResult> {
  const parsed = schema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Ungültige Eingabe.' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Nicht eingeloggt.' }

  const { data: briefing } = await supabase
    .from('briefings')
    .select('id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!briefing) {
    redirect('/onboarding')
  }

  const d = parsed.data
  const { error: updateError } = await supabase
    .from('briefings')
    .update({
      brand_name: d.brand_name,
      niche: d.niche,
      audience: d.audience,
      tone: d.tone,
      language: d.language,
      content_pillars: d.content_pillars,
      visual_style: d.visual_style || null,
      music_vibe: d.music_vibe || null,
      video_length_sec: d.video_length_sec,
      frequency: d.frequency,
      post_times: d.post_times,
      timezone: d.timezone,
      auto_post: d.auto_post,
      is_active: d.is_active,
    })
    .eq('id', briefing.id)
    .eq('user_id', user.id)

  if (updateError) {
    return { error: `Speichern fehlgeschlagen: ${updateError.message}` }
  }

  revalidatePath('/settings')
  revalidatePath('/dashboard')
  return { saved: true }
}
