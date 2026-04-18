'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  createReelContainer,
  getContainerStatus,
  publishContainer,
  getMediaPermalink,
} from '@/lib/meta-publish'

export async function deleteScheduledPostAction(formData: FormData): Promise<void> {
  const id = String(formData.get('id') ?? '')
  if (!id) return

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from('scheduled_posts').delete().eq('id', id).eq('user_id', user.id)

  revalidatePath('/schedule')
}

export async function cancelScheduledPostAction(formData: FormData): Promise<void> {
  const id = String(formData.get('id') ?? '')
  if (!id) return

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('scheduled_posts')
    .update({ status: 'canceled' })
    .eq('id', id)
    .eq('user_id', user.id)
    .in('status', ['approved', 'pending-approval'])

  revalidatePath('/schedule')
}

export type PublishNowResult =
  | { error: string }
  | { status: 'posted'; permalink: string | null }
  | { status: 'posting' }
  | undefined

type JoinedPost = {
  id: string
  user_id: string
  status: string
  ig_media_id: string | null
  scripts: { video_url: string | null; caption: string; hashtags: string[]; cta: string } | null
  instagram_accounts: { ig_user_id: string; access_token: string } | null
}

function composeCaption(caption: string, cta: string | null, hashtags: string[]): string {
  const parts = [caption]
  if (cta) parts.push('', cta)
  if (hashtags.length > 0) parts.push('', hashtags.map((h) => `#${h}`).join(' '))
  return parts.join('\n')
}

async function logJob(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
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

const POLL_INTERVAL_MS = 3000
const POLL_MAX_ATTEMPTS = 25

function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms))
}

export async function publishNowAction(
  _prev: PublishNowResult,
  formData: FormData,
): Promise<PublishNowResult> {
  const postId = String(formData.get('id') ?? '')
  if (!postId) return { error: 'Keine Post-ID.' }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Nicht eingeloggt.' }

  const admin = createAdminClient()
  const started = Date.now()

  const { data: raw } = await admin
    .from('scheduled_posts')
    .select(
      'id, user_id, status, ig_media_id, scripts ( video_url, caption, hashtags, cta ), instagram_accounts ( ig_user_id, access_token )',
    )
    .eq('id', postId)
    .eq('user_id', user.id)
    .maybeSingle()

  const post = raw as unknown as JoinedPost | null
  if (!post) return { error: 'Post nicht gefunden.' }

  if (post.status === 'posted') {
    return { error: 'Post ist bereits veröffentlicht.' }
  }
  if (post.status === 'canceled') {
    return { error: 'Post ist abgebrochen.' }
  }
  if (!post.scripts?.video_url) {
    return { error: 'Skript hat keine Video-URL.' }
  }
  if (!post.instagram_accounts) {
    return { error: 'Kein verknüpfter Instagram-Account.' }
  }

  const account = post.instagram_accounts
  let containerId = post.ig_media_id

  // Start wenn nötig (approved, failed, oder leere ig_media_id)
  if (post.status !== 'posting' || !containerId) {
    try {
      if (post.status === 'failed') {
        await admin
          .from('scheduled_posts')
          .update({ status: 'approved', post_error: null, ig_media_id: null })
          .eq('id', post.id)
      }

      containerId = await createReelContainer({
        igUserId: account.ig_user_id,
        videoUrl: post.scripts.video_url,
        caption: composeCaption(post.scripts.caption, post.scripts.cta, post.scripts.hashtags),
        accessToken: account.access_token,
      })

      await admin
        .from('scheduled_posts')
        .update({ status: 'posting', ig_media_id: containerId, post_error: null })
        .eq('id', post.id)

      await logJob(
        admin,
        user.id,
        'publishNow-start',
        'ok',
        { post_id: post.id, containerId },
        Date.now() - started,
      )
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      await admin
        .from('scheduled_posts')
        .update({ status: 'failed', post_error: message.slice(0, 500) })
        .eq('id', post.id)
      await logJob(
        admin,
        user.id,
        'publishNow-start',
        'error',
        { post_id: post.id },
        Date.now() - started,
        message,
      )
      revalidatePath('/schedule')
      return { error: message }
    }
  }

  // Poll bis FINISHED / ERROR / Timeout
  for (let attempt = 0; attempt < POLL_MAX_ATTEMPTS; attempt++) {
    await sleep(POLL_INTERVAL_MS)
    try {
      const status = await getContainerStatus({
        containerId: containerId!,
        accessToken: account.access_token,
      })
      if (status.status_code === 'IN_PROGRESS') continue
      if (status.status_code === 'ERROR' || status.status_code === 'EXPIRED') {
        throw new Error(
          `Container ${status.status_code}${status.error ? `: ${status.error}` : ''}`,
        )
      }

      // FINISHED oder PUBLISHED → veröffentlichen
      const mediaId = await publishContainer({
        igUserId: account.ig_user_id,
        creationId: containerId!,
        accessToken: account.access_token,
      })
      const permalink = await getMediaPermalink({
        mediaId,
        accessToken: account.access_token,
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

      await logJob(
        admin,
        user.id,
        'publishNow-finalize',
        'ok',
        { post_id: post.id, mediaId },
        Date.now() - started,
      )
      revalidatePath('/schedule')
      return { status: 'posted', permalink }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      await admin
        .from('scheduled_posts')
        .update({ status: 'failed', post_error: message.slice(0, 500) })
        .eq('id', post.id)
      await logJob(
        admin,
        user.id,
        'publishNow-finalize',
        'error',
        { post_id: post.id },
        Date.now() - started,
        message,
      )
      revalidatePath('/schedule')
      return { error: message }
    }
  }

  // Timeout — status bleibt 'posting', Cron übernimmt
  revalidatePath('/schedule')
  return { status: 'posting' }
}
