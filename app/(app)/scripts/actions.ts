'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { readFile, unlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { generateText, Output, NoObjectGeneratedError, APICallError } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { renderScriptVideo } from '@/lib/video/render'

type RenderSegment = {
  order: number
  duration_sec: number
  voiceover?: string
  on_screen_text?: string
  b_roll_hint: string
}

export type GenerateScriptResult = { error: string } | undefined

export async function deleteScriptAction(formData: FormData): Promise<void> {
  const id = String(formData.get('id') ?? '')
  if (!id) return

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  // Best-effort cleanup des Storage-Files; FK-Cascade kümmert sich um scheduled_posts.
  const admin = createAdminClient()
  await admin.storage
    .from('videos')
    .remove([`${user.id}/${id}.mp4`])
    .catch(() => {})

  await supabase.from('scripts').delete().eq('id', id).eq('user_id', user.id)

  revalidatePath('/scripts')
  revalidatePath('/ideas')
  revalidatePath('/schedule')
  redirect('/scripts')
}

const segmentSchema = z.object({
  order: z.number().describe('Ganzzahlige Reihenfolge, 1-basiert (1, 2, 3, ...).'),
  duration_sec: z
    .number()
    .describe('Ganzzahlige Dauer des Segments in Sekunden, zwischen 1 und 30.'),
  voiceover: z
    .string()
    .describe('Was der Sprecher/Creator sagt. Ein bis zwei kurze Sätze pro Segment.'),
  on_screen_text: z
    .string()
    .optional()
    .describe('Optionaler Text, der im Video eingeblendet wird. Kurz, 3–8 Wörter.'),
  b_roll_hint: z
    .string()
    .describe('Konkreter visueller Hinweis für den Cut — was man sieht.'),
})

const scriptSchema = z.object({
  hook_text: z
    .string()
    .describe(
      'Der zentrale On-Screen-Text für das Reel (kein kurzer Einzeiler, sondern ' +
        '1–3 Sätze mit insgesamt 60–200 Zeichen). Dieser Text wird über die komplette ' +
        'Reel-Dauer groß auf dem Video angezeigt — also prägnant, gut lesbar, ohne Emojis.',
    ),
  segments: z
    .array(segmentSchema)
    .describe('3–6 Segmente, die sich zur Ziel-Videolänge addieren.'),
  caption: z.string().describe('Instagram-Caption in der Briefing-Sprache, 40–600 Zeichen.'),
  hashtags: z
    .array(z.string())
    .describe('6–18 Hashtags ohne #-Zeichen, Mix aus breit und spezifisch.'),
  cta: z.string().describe('Klare Handlungsaufforderung am Ende (1 Satz).'),
})

export async function generateScriptAction(formData: FormData): Promise<GenerateScriptResult> {
  const ideaId = String(formData.get('idea_id') ?? '')
  if (!ideaId) return { error: 'Keine Idea-ID.' }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Nicht eingeloggt.' }

  const [{ data: idea }, { data: briefing }] = await Promise.all([
    supabase
      .from('ideas')
      .select('id, briefing_id, hook, concept, hook_type, appeal, format, pillar')
      .eq('id', ideaId)
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('briefings')
      .select(
        'id, brand_name, niche, audience, tone, language, content_pillars, video_length_sec, music_vibe, visual_style',
      )
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  if (!idea) return { error: 'Idee nicht gefunden.' }
  if (!briefing) return { error: 'Kein aktives Briefing.' }

  const prompt = [
    `Du schreibst ein Instagram-Reel-Skript für ${briefing.brand_name}.`,
    `Nische: ${briefing.niche}`,
    `Zielgruppe: ${briefing.audience}`,
    `Tonalität: ${briefing.tone}`,
    `Sprache: ${briefing.language}`,
    `Ziel-Videolänge: ${briefing.video_length_sec} Sekunden`,
    briefing.visual_style ? `Visueller Stil: ${briefing.visual_style}` : '',
    briefing.music_vibe ? `Music-Vibe: ${briefing.music_vibe}` : '',
    '',
    `Grundidee:`,
    `- Hook: ${idea.hook}`,
    idea.concept ? `- Concept: ${idea.concept}` : '',
    idea.format ? `- Format: ${idea.format}` : '',
    idea.pillar ? `- Pillar: ${idea.pillar}` : '',
    '',
    'Regeln:',
    `- Die Summe aller segment.duration_sec muss ungefähr ${briefing.video_length_sec} ergeben (±2s).`,
    '- Voiceover ist gesprochen — natürliche Sprache, keine Stichpunkte.',
    '- on_screen_text nur dann, wenn er den Voiceover verstärkt, nicht wiederholt.',
    '- b_roll_hint ist konkret ("Hände tippen auf Laptop"), nicht vage ("Arbeiten").',
    '- Caption + Hashtags in Briefing-Sprache. Hashtags ohne #.',
    '- CTA passt zur Zielgruppe (Follow, Save, Kommentar — kein generisches "Link in Bio").',
  ]
    .filter(Boolean)
    .join('\n')

  try {
    const { output: script } = await generateText({
      model: anthropic('claude-sonnet-4-6'),
      output: Output.object({ schema: scriptSchema, name: 'script' }),
      prompt,
      temperature: 0.7,
    })

    const totalDuration = script.segments.reduce((sum, s) => sum + s.duration_sec, 0)

    const { data: inserted, error: insertError } = await supabase
      .from('scripts')
      .insert({
        user_id: user.id,
        briefing_id: briefing.id,
        idea_id: idea.id,
        hook_text: script.hook_text,
        segments: script.segments,
        caption: script.caption,
        hashtags: script.hashtags,
        cta: script.cta,
        music_vibe: briefing.music_vibe,
        total_duration: totalDuration,
      })
      .select('id')
      .single()

    if (insertError || !inserted) {
      return { error: `Skript speichern fehlgeschlagen: ${insertError?.message ?? 'unbekannt'}` }
    }

    await supabase
      .from('ideas')
      .update({ status: 'scripted' })
      .eq('id', idea.id)
      .eq('user_id', user.id)

    revalidatePath('/ideas')
    revalidatePath('/scripts')
    redirect(`/scripts/${inserted.id}`)
  } catch (err) {
    // Next.js redirect wirft intern einen Error, den wir durchreichen müssen.
    if (err instanceof Error && err.message === 'NEXT_REDIRECT') throw err
    if (NoObjectGeneratedError.isInstance(err)) {
      return { error: 'Claude konnte kein strukturiertes Skript liefern. Erneut versuchen.' }
    }
    if (APICallError.isInstance(err)) {
      if (err.statusCode === 401) return { error: 'Anthropic-Key ungültig.' }
      if (err.statusCode === 429) return { error: 'Ratenlimit erreicht. Kurz warten.' }
      return { error: `Anthropic-Fehler: ${err.message}` }
    }
    return { error: `Unerwarteter Fehler: ${err instanceof Error ? err.message : String(err)}` }
  }
}

export type SchedulePostResult = { error: string } | undefined

const scheduleSchema = z.object({
  script_id: z.string().uuid(),
  video_url: z.string().url().refine((u) => u.startsWith('https://'), {
    message: 'Video-URL muss HTTPS sein.',
  }),
  scheduled_for: z
    .string()
    .min(1)
    .transform((v) => new Date(v))
    .refine((d) => !isNaN(d.getTime()), { message: 'Ungültiges Datum.' })
    .refine((d) => d.getTime() > Date.now() + 60_000, {
      message: 'Zeitpunkt muss mindestens 1 Minute in der Zukunft liegen.',
    }),
})

export async function schedulePostAction(
  _prev: SchedulePostResult,
  formData: FormData,
): Promise<SchedulePostResult> {
  const parsed = scheduleSchema.safeParse({
    script_id: formData.get('script_id'),
    video_url: formData.get('video_url'),
    scheduled_for: formData.get('scheduled_for'),
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Ungültige Eingabe.' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Nicht eingeloggt.' }

  const [{ data: script }, { data: account }] = await Promise.all([
    supabase
      .from('scripts')
      .select('id, briefing_id, caption, hashtags')
      .eq('id', parsed.data.script_id)
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('instagram_accounts')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  if (!script) return { error: 'Skript nicht gefunden.' }
  if (!account) {
    return { error: 'Kein Instagram-Account verknüpft. Bitte unter /accounts verbinden.' }
  }

  const { error: scriptUpdateError } = await supabase
    .from('scripts')
    .update({ video_url: parsed.data.video_url })
    .eq('id', script.id)
    .eq('user_id', user.id)

  if (scriptUpdateError) {
    return { error: `Video-URL speichern fehlgeschlagen: ${scriptUpdateError.message}` }
  }

  const { error: insertError } = await supabase.from('scheduled_posts').insert({
    user_id: user.id,
    briefing_id: script.briefing_id,
    script_id: script.id,
    ig_account_id: account.id,
    scheduled_for: parsed.data.scheduled_for.toISOString(),
    status: 'approved',
  })

  if (insertError) {
    return { error: `Post planen fehlgeschlagen: ${insertError.message}` }
  }

  revalidatePath('/schedule')
  revalidatePath(`/scripts/${script.id}`)
  redirect('/schedule?scheduled=1')
}

export type RenderVideoResult = { error: string } | { videoUrl: string } | undefined

function isSegmentArray(value: unknown): value is RenderSegment[] {
  return (
    Array.isArray(value) &&
    value.every(
      (s) =>
        typeof s === 'object' &&
        s !== null &&
        typeof (s as RenderSegment).order === 'number' &&
        typeof (s as RenderSegment).duration_sec === 'number' &&
        typeof (s as RenderSegment).b_roll_hint === 'string',
    )
  )
}

export async function renderVideoAction(
  _prev: RenderVideoResult,
  formData: FormData,
): Promise<RenderVideoResult> {
  const scriptId = String(formData.get('script_id') ?? '')
  if (!scriptId) return { error: 'Keine Script-ID.' }

  if (!process.env.PEXELS_API_KEY) {
    return { error: 'PEXELS_API_KEY fehlt in .env.local (kostenlos unter pexels.com/api).' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Nicht eingeloggt.' }

  const [{ data: script }, { data: briefing }] = await Promise.all([
    supabase
      .from('scripts')
      .select('id, hook_text, segments, total_duration, render_status')
      .eq('id', scriptId)
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('briefings')
      .select('brand_name, visual_style')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  if (!script) return { error: 'Skript nicht gefunden.' }
  if (script.render_status === 'rendering') {
    return { error: 'Render läuft bereits.' }
  }

  const segments = isSegmentArray(script.segments) ? script.segments : null
  if (!segments || segments.length === 0) {
    return { error: 'Skript hat keine Segmente.' }
  }

  const durationSec =
    script.total_duration ??
    segments.reduce((sum, s) => sum + (Number(s.duration_sec) || 0), 0) ??
    20

  const title = script.hook_text ?? ''
  const body = segments[0]?.voiceover ?? ''

  // Compose a mood-aware Pexels query: visual_style sets the overall vibe,
  // segments[0].b_roll_hint adds content specificity.
  const backgroundQuery = [briefing?.visual_style, segments[0]?.b_roll_hint]
    .filter((s): s is string => Boolean(s?.trim()))
    .join(' ')
    .trim() || 'cinematic abstract background'

  const admin = createAdminClient()
  await admin
    .from('scripts')
    .update({ render_status: 'rendering', render_error: null })
    .eq('id', script.id)

  const outputPath = path.join(tmpdir(), `reelforge-${randomUUID()}.mp4`)

  try {
    await renderScriptVideo({
      title,
      body,
      backgroundQuery,
      durationSec,
      outputPath,
    })
    const buffer = await readFile(outputPath)

    const storagePath = `${user.id}/${script.id}.mp4`
    const { error: uploadError } = await admin.storage
      .from('videos')
      .upload(storagePath, buffer, {
        contentType: 'video/mp4',
        upsert: true,
      })
    if (uploadError) throw new Error(`Storage-Upload: ${uploadError.message}`)

    const {
      data: { publicUrl },
    } = admin.storage.from('videos').getPublicUrl(storagePath)

    const { error: updateError } = await admin
      .from('scripts')
      .update({
        video_url: publicUrl,
        render_status: 'rendered',
        render_error: null,
      })
      .eq('id', script.id)
    if (updateError) throw new Error(`Script-Update: ${updateError.message}`)

    revalidatePath(`/scripts/${script.id}`)
    revalidatePath('/scripts')
    return { videoUrl: publicUrl }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    await admin
      .from('scripts')
      .update({
        render_status: 'failed',
        render_error: message.slice(0, 500),
      })
      .eq('id', script.id)
    revalidatePath(`/scripts/${script.id}`)
    return { error: `Render fehlgeschlagen: ${message}` }
  } finally {
    await unlink(outputPath).catch(() => {})
  }
}
