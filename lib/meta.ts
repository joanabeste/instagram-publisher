import 'server-only'

const GRAPH_VERSION = 'v21.0'
const GRAPH_BASE = `https://graph.instagram.com/${GRAPH_VERSION}`
const AUTH_BASE = 'https://www.instagram.com/oauth/authorize'
const TOKEN_BASE = 'https://api.instagram.com/oauth/access_token'
const LONG_LIVED_BASE = 'https://graph.instagram.com/access_token'

export const META_SCOPES = [
  'instagram_business_basic',
  'instagram_business_content_publish',
] as const

export function getRedirectUri(): string {
  const override = process.env.META_REDIRECT_URI
  if (override) return override
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  return `${appUrl}/auth/meta/callback`
}

export function buildAuthorizeUrl(state: string): string {
  const appId = process.env.META_APP_ID
  if (!appId) throw new Error('META_APP_ID fehlt')

  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: getRedirectUri(),
    state,
    scope: META_SCOPES.join(','),
    response_type: 'code',
  })
  return `${AUTH_BASE}?${params.toString()}`
}

type ShortLivedTokenResponse = {
  access_token: string
  user_id: string | number
  permissions?: string[]
}

export async function exchangeCodeForToken(code: string): Promise<ShortLivedTokenResponse> {
  const appId = process.env.META_APP_ID
  const appSecret = process.env.META_APP_SECRET
  if (!appId || !appSecret) throw new Error('META_APP_ID/META_APP_SECRET fehlen')

  const body = new URLSearchParams({
    client_id: appId,
    client_secret: appSecret,
    grant_type: 'authorization_code',
    redirect_uri: getRedirectUri(),
    code,
  })

  const res = await fetch(TOKEN_BASE, {
    method: 'POST',
    body,
    cache: 'no-store',
  })
  if (!res.ok) {
    throw new Error(`Token-Exchange fehlgeschlagen: ${res.status} ${await res.text()}`)
  }
  return (await res.json()) as ShortLivedTokenResponse
}

type LongLivedTokenResponse = {
  access_token: string
  token_type: string
  expires_in: number
}

export async function exchangeLongLivedToken(
  shortToken: string,
): Promise<LongLivedTokenResponse> {
  const appSecret = process.env.META_APP_SECRET
  if (!appSecret) throw new Error('META_APP_SECRET fehlt')

  const params = new URLSearchParams({
    grant_type: 'ig_exchange_token',
    client_secret: appSecret,
    access_token: shortToken,
  })

  const res = await fetch(`${LONG_LIVED_BASE}?${params.toString()}`, {
    cache: 'no-store',
  })
  if (!res.ok) {
    throw new Error(`Long-lived-Exchange fehlgeschlagen: ${res.status} ${await res.text()}`)
  }
  return (await res.json()) as LongLivedTokenResponse
}

export type InstagramProfile = {
  ig_user_id: string
  ig_username: string | null
}

export async function getInstagramProfile(accessToken: string): Promise<InstagramProfile> {
  const params = new URLSearchParams({
    fields: 'user_id,username',
    access_token: accessToken,
  })
  const res = await fetch(`${GRAPH_BASE}/me?${params.toString()}`, { cache: 'no-store' })
  if (!res.ok) {
    throw new Error(`Profil laden fehlgeschlagen: ${res.status} ${await res.text()}`)
  }
  const json = (await res.json()) as { user_id?: string; username?: string }
  if (!json.user_id) throw new Error('Instagram-User-ID fehlt in Profil-Response')
  return {
    ig_user_id: json.user_id,
    ig_username: json.username ?? null,
  }
}
