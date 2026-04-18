import 'server-only'

const GRAPH_VERSION = 'v21.0'
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`

async function graphFetch<T>(
  url: string,
  init?: RequestInit & { expected?: string },
): Promise<T> {
  const res = await fetch(url, { ...init, cache: 'no-store' })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(
      `Graph ${init?.expected ?? 'request'} ${res.status}: ${body.slice(0, 400)}`,
    )
  }
  return (await res.json()) as T
}

export async function createReelContainer(params: {
  igUserId: string
  videoUrl: string
  caption: string
  accessToken: string
}): Promise<string> {
  const body = new URLSearchParams({
    media_type: 'REELS',
    video_url: params.videoUrl,
    caption: params.caption,
    access_token: params.accessToken,
  })
  const data = await graphFetch<{ id: string }>(`${GRAPH_BASE}/${params.igUserId}/media`, {
    method: 'POST',
    body,
    expected: 'create-container',
  })
  return data.id
}

export type ContainerStatus = {
  status_code: 'IN_PROGRESS' | 'FINISHED' | 'ERROR' | 'EXPIRED' | 'PUBLISHED'
  error?: string
}

export async function getContainerStatus(params: {
  containerId: string
  accessToken: string
}): Promise<ContainerStatus> {
  const qs = new URLSearchParams({
    fields: 'status_code,status',
    access_token: params.accessToken,
  })
  return graphFetch<ContainerStatus>(
    `${GRAPH_BASE}/${params.containerId}?${qs.toString()}`,
    { expected: 'container-status' },
  )
}

export async function publishContainer(params: {
  igUserId: string
  creationId: string
  accessToken: string
}): Promise<string> {
  const body = new URLSearchParams({
    creation_id: params.creationId,
    access_token: params.accessToken,
  })
  const data = await graphFetch<{ id: string }>(
    `${GRAPH_BASE}/${params.igUserId}/media_publish`,
    { method: 'POST', body, expected: 'publish' },
  )
  return data.id
}

export async function getMediaPermalink(params: {
  mediaId: string
  accessToken: string
}): Promise<string | null> {
  try {
    const qs = new URLSearchParams({
      fields: 'permalink',
      access_token: params.accessToken,
    })
    const data = await graphFetch<{ permalink?: string }>(
      `${GRAPH_BASE}/${params.mediaId}?${qs.toString()}`,
      { expected: 'permalink' },
    )
    return data.permalink ?? null
  } catch {
    return null
  }
}
