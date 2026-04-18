import { NextResponse, type NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import {
  exchangeCodeForToken,
  exchangeLongLivedToken,
  getInstagramProfile,
} from '@/lib/meta'

const STATE_COOKIE = 'meta_oauth_state'

function fail(origin: string, code: string) {
  return NextResponse.redirect(`${origin}/accounts?error=${encodeURIComponent(code)}`)
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const returnedState = searchParams.get('state')
  const oauthError = searchParams.get('error')

  if (oauthError) return fail(origin, oauthError)
  if (!code || !returnedState) return fail(origin, 'missing-params')

  const cookieStore = await cookies()
  const cookieState = cookieStore.get(STATE_COOKIE)?.value
  cookieStore.delete(STATE_COOKIE)
  if (!cookieState || cookieState !== returnedState) {
    return fail(origin, 'state-mismatch')
  }

  let briefingId: string
  try {
    const decoded = JSON.parse(Buffer.from(returnedState, 'base64url').toString('utf8'))
    if (typeof decoded?.b !== 'string') throw new Error('invalid')
    briefingId = decoded.b
  } catch {
    return fail(origin, 'state-decode')
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return fail(origin, 'not-authenticated')

  try {
    const short = await exchangeCodeForToken(code)
    const long = await exchangeLongLivedToken(short.access_token)
    const profile = await getInstagramProfile(long.access_token)

    const tokenExpiresAt = long.expires_in
      ? new Date(Date.now() + long.expires_in * 1000).toISOString()
      : null

    const { error: insertError } = await supabase.from('instagram_accounts').insert({
      user_id: user.id,
      briefing_id: briefingId,
      ig_user_id: profile.ig_user_id,
      ig_username: profile.ig_username,
      fb_page_id: '',
      access_token: long.access_token,
      token_expires_at: tokenExpiresAt,
      last_refreshed_at: new Date().toISOString(),
    })

    if (insertError) {
      return fail(origin, `insert-failed:${insertError.code ?? 'unknown'}`)
    }

    return NextResponse.redirect(`${origin}/accounts?connected=1`)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return fail(origin, `api-error:${message.slice(0, 80)}`)
  }
}
