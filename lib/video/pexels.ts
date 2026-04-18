import 'server-only'

const PEXELS_SEARCH = 'https://api.pexels.com/videos/search'

type PexelsVideoFile = {
  link: string
  width: number
  height: number
  file_type: string
}

type PexelsVideo = {
  id: number
  duration: number
  width: number
  height: number
  video_files: PexelsVideoFile[]
}

type PexelsSearchResponse = {
  videos: PexelsVideo[]
}

export type Clip = {
  url: string
  duration: number
}

export async function searchPortraitClip(query: string): Promise<Clip | null> {
  const apiKey = process.env.PEXELS_API_KEY
  if (!apiKey) throw new Error('PEXELS_API_KEY fehlt')

  const params = new URLSearchParams({
    query,
    orientation: 'portrait',
    size: 'medium',
    per_page: '3',
  })

  const res = await fetch(`${PEXELS_SEARCH}?${params.toString()}`, {
    headers: { Authorization: apiKey },
    cache: 'no-store',
  })
  if (!res.ok) {
    throw new Error(`Pexels-Suche fehlgeschlagen: ${res.status} ${await res.text()}`)
  }

  const json = (await res.json()) as PexelsSearchResponse
  if (!json.videos?.length) return null

  for (const video of json.videos) {
    const file = pickBestFile(video.video_files)
    if (file) return { url: file.link, duration: video.duration }
  }
  return null
}

function pickBestFile(files: PexelsVideoFile[]): PexelsVideoFile | null {
  const mp4 = files.filter((f) => f.file_type === 'video/mp4')
  if (mp4.length === 0) return null

  const upright = mp4.filter((f) => f.height >= f.width)
  const pool = upright.length > 0 ? upright : mp4

  // Prefer widths <= 1080 (matches our 1080x1920 output), largest that still fits.
  const underOrEqual = pool.filter((f) => f.width <= 1080)
  const sorted = (underOrEqual.length > 0 ? underOrEqual : pool).sort(
    (a, b) => b.width - a.width,
  )
  return sorted[0] ?? null
}
