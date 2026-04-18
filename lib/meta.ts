import 'server-only'

const GRAPH_VERSION = 'v21.0'
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`
const DIALOG_BASE = `https://www.facebook.com/${GRAPH_VERSION}/dialog/oauth`

export const META_SCOPES = [
  'instagram_basic',
  'instagram_content_publish',
  'pages_show_list',
  'pages_read_engagement',
  'business_management',
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
  return `${DIALOG_BASE}?${params.toString()}`
}

type ShortLivedTokenResponse = {
  access_token: string
  token_type: string
  expires_in?: number
}

export async function exchangeCodeForToken(code: string): Promise<ShortLivedTokenResponse> {
  const appId = process.env.META_APP_ID
  const appSecret = process.env.META_APP_SECRET
  if (!appId || !appSecret) throw new Error('META_APP_ID/META_APP_SECRET fehlen')

  const params = new URLSearchParams({
    client_id: appId,
    client_secret: appSecret,
    redirect_uri: getRedirectUri(),
    code,
  })

  const res = await fetch(`${GRAPH_BASE}/oauth/access_token?${params.toString()}`, {
    cache: 'no-store',
  })
  if (!res.ok) {
    throw new Error(`Token-Exchange fehlgeschlagen: ${res.status} ${await res.text()}`)
  }
  return (await res.json()) as ShortLivedTokenResponse
}

export async function exchangeLongLivedToken(
  shortToken: string,
): Promise<ShortLivedTokenResponse> {
  const appId = process.env.META_APP_ID
  const appSecret = process.env.META_APP_SECRET
  if (!appId || !appSecret) throw new Error('META_APP_ID/META_APP_SECRET fehlen')

  const params = new URLSearchParams({
    grant_type: 'fb_exchange_token',
    client_id: appId,
    client_secret: appSecret,
    fb_exchange_token: shortToken,
  })

  const res = await fetch(`${GRAPH_BASE}/oauth/access_token?${params.toString()}`, {
    cache: 'no-store',
  })
  if (!res.ok) {
    throw new Error(`Long-lived-Exchange fehlgeschlagen: ${res.status} ${await res.text()}`)
  }
  return (await res.json()) as ShortLivedTokenResponse
}

export type MetaPage = {
  id: string
  name: string
  access_token: string
}

export async function getUserPages(userToken: string): Promise<MetaPage[]> {
  const res = await fetch(
    `${GRAPH_BASE}/me/accounts?fields=id,name,access_token&access_token=${encodeURIComponent(userToken)}`,
    { cache: 'no-store' },
  )
  if (!res.ok) {
    throw new Error(`Pages laden fehlgeschlagen: ${res.status} ${await res.text()}`)
  }
  const json = (await res.json()) as { data: MetaPage[] }
  return json.data
}

export type PageInstagramAccount = {
  ig_user_id: string
  ig_username: string | null
}

export async function getPageInstagramAccount(
  pageId: string,
  pageToken: string,
): Promise<PageInstagramAccount | null> {
  const res = await fetch(
    `${GRAPH_BASE}/${pageId}?fields=instagram_business_account{id,username}&access_token=${encodeURIComponent(pageToken)}`,
    { cache: 'no-store' },
  )
  if (!res.ok) return null
  const json = (await res.json()) as {
    instagram_business_account?: { id: string; username?: string }
  }
  if (!json.instagram_business_account) return null
  return {
    ig_user_id: json.instagram_business_account.id,
    ig_username: json.instagram_business_account.username ?? null,
  }
}
