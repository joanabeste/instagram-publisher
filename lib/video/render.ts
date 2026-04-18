import 'server-only'

import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { createWriteStream, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { pipeline } from 'node:stream/promises'
import { Readable } from 'node:stream'
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg'
import ffmpeg from 'fluent-ffmpeg'
import { searchPortraitClip } from './pexels'

ffmpeg.setFfmpegPath(ffmpegInstaller.path)

const WIDTH = 1080
const HEIGHT = 1920

// Layout: title starts in the upper-middle third, body is placed below the
// title based on how many lines the title actually takes. No branding/signature.
const TITLE_Y = 560

const TITLE_WRAP = 20
const BODY_WRAP = 24

function resolveFontPath(): string {
  // Prefer a user-provided serif at public/fonts/Serif-Regular.ttf (for the
  // reference astro-reel aesthetic), fall back to Geist bundled by Next/@vercel/og.
  const serif = path.join(process.cwd(), 'public/fonts/Serif-Regular.ttf')
  if (existsSync(serif)) return serif

  const geist = path.join(
    process.cwd(),
    'node_modules/next/dist/compiled/@vercel/og/Geist-Regular.ttf',
  )
  if (!existsSync(geist)) {
    throw new Error(
      `Keine Font gefunden. Erwartet: ${serif} ODER ${geist}. next muss installiert sein.`,
    )
  }
  return geist
}

export type RenderInput = {
  title: string
  body: string
  backgroundQuery: string
  durationSec: number
  outputPath: string
}

export async function renderScriptVideo(input: RenderInput): Promise<void> {
  const work = await mkdtemp(path.join(tmpdir(), 'reelforge-'))
  try {
    const normalized = path.join(work, 'bg.mp4')

    // 1. Fetch background clip (or fall back to solid color) and normalize to
    //    1080x1920 / 30 fps / yuv420p, looping to full duration.
    let haveClip = false
    try {
      const clip = await searchPortraitClip(input.backgroundQuery)
      if (clip) {
        const downloaded = path.join(work, 'clip.mp4')
        await downloadTo(clip.url, downloaded)
        await normalizeAndLoop(downloaded, normalized, input.durationSec)
        haveClip = true
      }
    } catch {
      // fall through to color fallback
    }
    if (!haveClip) {
      await renderColorBackground(normalized, input.durationSec)
    }

    // 2. Overlay the 2-block text layout (title / body). No branding/signature
    //    because the platform overlay (user handle, like-button) already eats
    //    the bottom corners and more text there would just fight with it.
    await renderTextBlocks(normalized, input.outputPath, input, work)
  } finally {
    await rm(work, { recursive: true, force: true })
  }
}

async function normalizeAndLoop(
  input: string,
  output: string,
  durationSec: number,
): Promise<void> {
  await runFfmpeg('normalize', (cmd) => {
    cmd
      .input(input)
      .inputOptions(['-stream_loop -1'])
      .videoFilters(
        `scale=${WIDTH}:${HEIGHT}:force_original_aspect_ratio=increase,crop=${WIDTH}:${HEIGHT},setsar=1,format=yuv420p`,
      )
      .outputOptions([
        '-map 0:v:0',
        `-t ${durationSec}`,
        '-an',
        '-sn',
        '-dn',
        '-c:v libx264',
        '-pix_fmt yuv420p',
        '-preset veryfast',
        '-crf 23',
        '-r 30',
        '-vsync cfr',
        '-movflags +faststart',
      ])
      .output(output)
  })
}

async function renderColorBackground(output: string, durationSec: number): Promise<void> {
  await runFfmpeg('color-bg', (cmd) => {
    cmd
      .input(`color=c=black:s=${WIDTH}x${HEIGHT}:r=30:d=${durationSec}`)
      .inputOptions(['-f lavfi'])
      .outputOptions([
        '-an',
        '-c:v libx264',
        '-pix_fmt yuv420p',
        '-preset veryfast',
        '-crf 23',
        '-movflags +faststart',
      ])
      .output(output)
  })
}

type Block = {
  file: string
  fontsize: number
  lineSpacing: number
  y: number
}

async function renderTextBlocks(
  input: string,
  output: string,
  content: { title: string; body: string },
  workDir: string,
): Promise<void> {
  const fontPath = resolveFontPath()

  const blocks: Block[] = []

  const titleLines = wrapText(content.title, TITLE_WRAP)
  const bodyLines = wrapText(content.body, BODY_WRAP)

  if (titleLines.length > 0) {
    const file = path.join(workDir, 'title.txt')
    await writeFile(file, titleLines.join('\n'), 'utf8')
    blocks.push({
      file,
      fontsize: pickTitleFontsize(titleLines.length),
      lineSpacing: 22,
      y: TITLE_Y,
    })
  }

  if (bodyLines.length > 0) {
    const file = path.join(workDir, 'body.txt')
    await writeFile(file, bodyLines.join('\n'), 'utf8')
    // Title already consumed vertical space proportional to its line count;
    // shift the body down so the title/body gap stays consistent.
    const titleConsumed =
      titleLines.length > 0
        ? titleLines.length * (pickTitleFontsize(titleLines.length) + 22)
        : 0
    blocks.push({
      file,
      fontsize: pickBodyFontsize(bodyLines.length),
      lineSpacing: 18,
      y: TITLE_Y + titleConsumed + 60,
    })
  }

  if (blocks.length === 0) {
    await runFfmpeg('remux', (cmd) => {
      cmd.input(input).outputOptions(['-c copy', '-movflags +faststart']).output(output)
    })
    return
  }

  const drawtextFilters = blocks
    .map(
      (b) =>
        `drawtext=fontfile='${fontPath}':textfile='${b.file}'` +
        `:fontsize=${b.fontsize}:fontcolor=white` +
        `:borderw=3:bordercolor=black@0.8` +
        `:shadowx=2:shadowy=3:shadowcolor=black@0.9` +
        `:line_spacing=${b.lineSpacing}` +
        `:x=(w-text_w)/2:y=${b.y}`,
    )
    .join(',')

  await runFfmpeg('drawtext', (cmd) => {
    cmd
      .input(input)
      .videoFilters(drawtextFilters)
      .outputOptions([
        '-an',
        '-c:v libx264',
        '-pix_fmt yuv420p',
        '-preset veryfast',
        '-crf 23',
        '-r 30',
        '-movflags +faststart',
      ])
      .output(output)
  })
}

function wrapText(text: string, maxChars: number): string[] {
  const cleaned = text.replace(/\s+/g, ' ').trim()
  if (!cleaned) return []
  const words = cleaned.split(' ')
  const out: string[] = []
  let cur = ''
  for (const w of words) {
    if (!cur) {
      cur = w
      continue
    }
    if (cur.length + 1 + w.length <= maxChars) {
      cur += ' ' + w
    } else {
      out.push(cur)
      cur = w
    }
  }
  if (cur) out.push(cur)
  return out
}

function pickTitleFontsize(lineCount: number): number {
  if (lineCount <= 2) return 76
  if (lineCount <= 3) return 64
  if (lineCount <= 5) return 52
  return 44
}

function pickBodyFontsize(lineCount: number): number {
  if (lineCount <= 3) return 56
  if (lineCount <= 5) return 48
  if (lineCount <= 8) return 40
  return 34
}

async function downloadTo(url: string, dest: string): Promise<void> {
  const res = await fetch(url)
  if (!res.ok || !res.body) {
    throw new Error(`Download fehlgeschlagen: ${res.status}`)
  }
  await pipeline(Readable.fromWeb(res.body as never), createWriteStream(dest))
}

function runFfmpeg(
  label: string,
  build: (cmd: ffmpeg.FfmpegCommand) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const cmd = ffmpeg()
    build(cmd)
    let cmdline = ''
    let stderrTail = ''
    cmd
      .on('start', (line) => {
        cmdline = line
      })
      .on('stderr', (chunk) => {
        stderrTail = (stderrTail + chunk).split('\n').slice(-12).join('\n')
      })
      .on('error', (err) => {
        reject(
          new Error(
            `FFmpeg[${label}]: ${err.message}\n--- cmdline ---\n${cmdline}\n--- stderr tail ---\n${stderrTail}`,
          ),
        )
      })
      .on('end', () => resolve())
      .run()
  })
}
