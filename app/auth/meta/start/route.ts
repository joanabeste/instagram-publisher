import { NextResponse, type NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { randomBytes } from 'node:crypto'
import { createClient } from '@/lib/supabase/server'
import { buildAuthorizeUrl } from '@/lib/meta'

const STATE_COOKIE = 'meta_oauth_state'
const STATE_TTL_SEC = 600

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.redirect(new URL('/login?next=/accounts', request.url))
  }

  const { data: briefing } = await supabase
    .from('briefings')
    .select('id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!briefing) {
    return NextResponse.redirect(new URL('/onboarding', request.url))
  }

  if (!process.env.META_APP_ID || !process.env.META_APP_SECRET) {
    return NextResponse.redirect(
      new URL('/accounts?error=meta-not-configured', request.url),
    )
  }

  const nonce = randomBytes(16).toString('hex')
  const statePayload = { n: nonce, b: briefing.id }
  const state = Buffer.from(JSON.stringify(statePayload)).toString('base64url')

  const cookieStore = await cookies()
  cookieStore.set(STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: STATE_TTL_SEC,
  })

  return NextResponse.redirect(buildAuthorizeUrl(state))
}
