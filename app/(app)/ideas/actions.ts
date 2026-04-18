'use server'

import { revalidatePath } from 'next/cache'
import { generateText, Output, NoObjectGeneratedError, APICallError } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

export type GenerateIdeasResult = { error: string } | { created: number }

const ideaSchema = z.object({
  hook: z
    .string()
    .describe(
      'Die Titelzeile des Reels — wird groß auf dem Video eingeblendet. ' +
        'Ein prägnanter Satz, 5–12 Wörter, scroll-stoppend. Keine Emojis.',
    ),
  concept: z
    .string()
    .describe(
      'Kerninhalt, der im Body als Fließtext auf dem Reel erscheint — 2–4 Sätze, ' +
        'eigenständig lesbar (keine Bezug auf Voiceover oder Handlung).',
    ),
  hook_type: z
    .enum(['question', 'statement', 'list', 'comparison', 'shock', 'story'])
    .describe('Grundmuster des Hooks.'),
  appeal: z
    .string()
    .describe('Emotionaler/psychologischer Appeal (z.B. Neugier, FOMO, Identifikation, Aha-Effekt).'),
  pillar: z
    .string()
    .describe('Welche Content-Säule dies bedient (aus der Briefing-Liste).'),
})

const IDEA_FORMAT = 'text-on-screen' as const

const BATCH_SIZE = 8

export async function generateIdeasAction(): Promise<GenerateIdeasResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Nicht eingeloggt.' }

  const { data: briefing, error: briefingError } = await supabase
    .from('briefings')
    .select(
      'id, brand_name, niche, audience, tone, language, content_pillars, visual_style, music_vibe',
    )
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (briefingError || !briefing) {
    return { error: 'Kein aktives Briefing gefunden.' }
  }

  const pillarsLine =
    briefing.content_pillars.length > 0
      ? briefing.content_pillars.join(', ')
      : '(keine definiert — wähle passende)'

  const prompt = [
    `Du bist Instagram-Reel-Stratege für ${briefing.brand_name}.`,
    `Nische: ${briefing.niche}`,
    `Zielgruppe: ${briefing.audience}`,
    `Tonalität: ${briefing.tone}`,
    `Sprache der Hooks: ${briefing.language}`,
    `Content-Säulen: ${pillarsLine}`,
    briefing.visual_style ? `Visueller Stil: ${briefing.visual_style}` : '',
    '',
    `Generiere ${BATCH_SIZE} unterschiedliche Reel-Ideen im Format TEXT-ON-SCREEN:`,
    '  → Hook + Concept werden als Text über B-Roll eingeblendet — kein Talking-Head, kein Voiceover als Haupt-Medium.',
    '  → Concept muss eigenständig lesbar sein (2–4 Sätze) und für die Leinwand geschrieben, nicht für gesprochene Sprache.',
    '- Hook in der oben genannten Sprache, scroll-stoppend, 3–10 Wörter',
    '- Pillar kommt aus der Content-Säulen-Liste (oder passt organisch dazu)',
    '- Die 8 Ideen variieren nur im Hook-Typ — nicht alle Fragen, nicht alle Listen',
    '- Keine Hashtags, keine Emojis in Hook/Concept',
  ]
    .filter(Boolean)
    .join('\n')

  try {
    const { output: ideas } = await generateText({
      model: anthropic('claude-sonnet-4-6'),
      output: Output.array({ element: ideaSchema, name: 'ideas' }),
      prompt,
      temperature: 0.9,
    })

    const rows = ideas.map((idea) => ({
      user_id: user.id,
      briefing_id: briefing.id,
      hook: idea.hook,
      concept: idea.concept,
      hook_type: idea.hook_type,
      appeal: idea.appeal,
      format: IDEA_FORMAT,
      pillar: idea.pillar,
      source: 'ai' as const,
      status: 'new' as const,
    }))

    const { error: insertError } = await supabase.from('ideas').insert(rows)
    if (insertError) {
      return { error: `Ideen speichern fehlgeschlagen: ${insertError.message}` }
    }

    revalidatePath('/ideas')
    return { created: rows.length }
  } catch (err) {
    if (NoObjectGeneratedError.isInstance(err)) {
      return { error: 'Claude konnte keine strukturierte Antwort liefern. Bitte erneut versuchen.' }
    }
    if (APICallError.isInstance(err)) {
      if (err.statusCode === 401) {
        return { error: 'Anthropic-Key ungültig. Prüfe ANTHROPIC_API_KEY.' }
      }
      if (err.statusCode === 429) {
        return { error: 'Anthropic-Ratenlimit erreicht. Kurz warten und erneut.' }
      }
      return { error: `Anthropic-API-Fehler: ${err.message}` }
    }
    return { error: `Unerwarteter Fehler: ${err instanceof Error ? err.message : String(err)}` }
  }
}

const statusSchema = z.enum(['new', 'scripted', 'rejected'])

export async function deleteIdeaAction(formData: FormData): Promise<void> {
  const id = String(formData.get('id') ?? '')
  if (!id) return

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  // FK-Cascade räumt scripts + scheduled_posts automatisch weg.
  await supabase.from('ideas').delete().eq('id', id).eq('user_id', user.id)

  revalidatePath('/ideas')
  revalidatePath('/scripts')
  revalidatePath('/schedule')
}

export async function updateIdeaStatusAction(formData: FormData): Promise<void> {
  const id = String(formData.get('id') ?? '')
  const statusInput = String(formData.get('status') ?? '')
  const parsed = statusSchema.safeParse(statusInput)
  if (!id || !parsed.success) return

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('ideas')
    .update({ status: parsed.data })
    .eq('id', id)
    .eq('user_id', user.id)

  revalidatePath('/ideas')
}
