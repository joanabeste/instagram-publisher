import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BriefingForm } from './briefing-form'

export const metadata = { title: 'Einstellungen — ReelForge' }

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: briefing } = await supabase
    .from('briefings')
    .select(
      'id, brand_name, niche, audience, tone, language, content_pillars, visual_style, music_vibe, video_length_sec, frequency, post_times, timezone, auto_post, is_active',
    )
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!briefing) {
    redirect('/onboarding')
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 md:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Einstellungen</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Briefing, Takt und Auto-Posting anpassen. Änderungen wirken sich auf künftige Ideen und
          Skripte aus.
        </p>
      </div>

      <BriefingForm
        initial={{
          brand_name: briefing.brand_name,
          niche: briefing.niche,
          audience: briefing.audience,
          tone: briefing.tone,
          language: briefing.language,
          content_pillars: briefing.content_pillars,
          visual_style: briefing.visual_style,
          music_vibe: briefing.music_vibe,
          video_length_sec: briefing.video_length_sec,
          frequency: briefing.frequency,
          post_times: briefing.post_times,
          timezone: briefing.timezone,
          auto_post: briefing.auto_post,
          is_active: briefing.is_active,
        }}
      />
    </div>
  )
}
