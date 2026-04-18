import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  createReelContainer,
  getContainerStatus,
  publishContainer,
  getMediaPermalink,
} from '@/lib/meta-publish'

const MAX_POSTS_PER_RUN = 10

type JoinedPost = {
  id: string
  user_id: string
  script_id: string
  ig_account_id: string
  status: string
  ig_media_id: string | null
  scripts: { video_url: string | null; caption: string; hashtags: string[]; cta: string } | null
  instagram_accounts: { ig_user_id: string; access_token: string } | null
}

function composeCaption(
  caption: string,
  cta: string | null | undefined,
  hashtags: string[],
): string {
  const parts = [caption]
  if (cta) parts.push('', cta)
  if (hashtags.length > 0) parts.push('', hashtags.map((h) => `#${h}`).join(' '))
  return parts.join('\n')
}

function isAuthorized(req: NextRequest): boolean {
  const expected = process.env.CRON_SECRET
  if (!expected) return false
  const header = req.headers.get('authorization') ?? ''
  return header === `Bearer ${expected}`
}

async function logJob(
  admin: ReturnType<typeof createAdminClient>,
  userId: string | null,
  jobType: string,
  status: string,
  payload: unknown,
  durationMs: number,
  error?: string,
) {
  await admin.from('job_logs').insert({
    user_id: userId,
    job_type: jobType,
    status,
    payload: payload as never,
    error: error ?? null,
    duration_ms: durationMs,
  })
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const started = Date.now()
  const summary = { started: 0, finalized: 0, failed: 0, skipped: 0 }

  // 1. Neue Posts starten
  const { data: approved } = (await admin
    .from('scheduled_posts')
    .select(
      'id, user_id, script_id, ig_account_id, status, ig_media_id, scripts ( video_url, caption, hashtags, cta ), instagram_accounts ( ig_user_id, access_token )',
    )
    .eq('status', 'approved')
    .lte('scheduled_for', new Date().toISOString())
    .order('scheduled_for', { ascending: true })
    .limit(MAX_POSTS_PER_RUN)) as unknown as { data: JoinedPost[] | null }

  for (const post of approved ?? []) {
    const t = Date.now()
    try {
      if (!post.scripts?.video_url) throw new Error('Skript hat keine video_url')
      if (!post.instagram_accounts) throw new Error('Kein IG-Account verknüpft')

      const caption = composeCaption(
        post.scripts.caption,
        post.scripts.cta,
        post.scripts.hashtags,
      )

      const containerId = await createReelContainer({
        igUserId: post.instagram_accounts.ig_user_id,
        videoUrl: post.scripts.video_url,
        caption,
        accessToken: post.instagram_accounts.access_token,
      })

      await admin
        .from('scheduled_posts')
        .update({ status: 'posting', ig_media_id: containerId, post_error: null })
        .eq('id', post.id)

      summary.started++
      await logJob(admin, post.user_id, 'publish-start', 'ok', { post_id: post.id, containerId }, Date.now() - t)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      await admin
        .from('scheduled_posts')
        .update({ status: 'failed', post_error: message.slice(0, 500) })
        .eq('id', post.id)
      summary.failed++
      await logJob(admin, post.user_id, 'publish-start', 'error', { post_id: post.id }, Date.now() - t, message)
    }
  }

  // 2. Laufende Container finalisieren
  const { data: posting } = (await admin
    .from('scheduled_posts')
    .select(
      'id, user_id, script_id, ig_account_id, status, ig_media_id, scripts ( video_url, caption, hashtags, cta ), instagram_accounts ( ig_user_id, access_token )',
    )
    .eq('status', 'posting')
    .limit(MAX_POSTS_PER_RUN)) as unknown as { data: JoinedPost[] | null }

  for (const post of posting ?? []) {
    const t = Date.now()
    try {
      if (!post.ig_media_id) throw new Error('Kein Container-ID im posting-Zustand')
      if (!post.instagram_accounts) throw new Error('Kein IG-Account verknüpft')

      const status = await getContainerStatus({
        containerId: post.ig_media_id,
        accessToken: post.instagram_accounts.access_token,
      })

      if (status.status_code === 'IN_PROGRESS') {
        summary.skipped++
        continue
      }
      if (status.status_code === 'ERROR' || status.status_code === 'EXPIRED') {
        throw new Error(`Container-Status ${status.status_code}${status.error ? `: ${status.error}` : ''}`)
      }

      // FINISHED oder PUBLISHED → publish + permalink
      const mediaId = await publishContainer({
        igUserId: post.instagram_accounts.ig_user_id,
        creationId: post.ig_media_id,
        accessToken: post.instagram_accounts.access_token,
      })

      const permalink = await getMediaPermalink({
        mediaId,
        accessToken: post.instagram_accounts.access_token,
      })

      await admin
        .from('scheduled_posts')
        .update({
          status: 'posted',
          ig_media_id: mediaId,
          ig_permalink: permalink,
          posted_at: new Date().toISOString(),
          post_error: null,
        })
        .eq('id', post.id)

      summary.finalized++
      await logJob(admin, post.user_id, 'publish-finalize', 'ok', { post_id: post.id, mediaId }, Date.now() - t)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      await admin
        .from('scheduled_posts')
        .update({ status: 'failed', post_error: message.slice(0, 500) })
        .eq('id', post.id)
      summary.failed++
      await logJob(admin, post.user_id, 'publish-finalize', 'error', { post_id: post.id }, Date.now() - t, message)
    }
  }

  return NextResponse.json({
    ok: true,
    summary,
    duration_ms: Date.now() - started,
  })
}
