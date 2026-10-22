export interface SubtitleCue {
  start: number
  end: number
  text: string
}

const ENTITIES: Record<string, string> = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&nbsp;': ' ', '&quot;': '"', '&#39;': "'" }

function seconds(stamp: string): number {
  const parts = stamp.trim().replace(',', '.').split(':').map(Number)
  if (parts.some((part) => Number.isNaN(part))) return Number.NaN
  return parts.reduce((total, part) => total * 60 + part, 0)
}

function clean(text: string): string {
  return text
    .replace(/\{\\[^}]*\}/g, '')
    .replace(/<[^>]*>/g, '')
    .replace(/&(?:amp|lt|gt|nbsp|quot|#39);/g, (entity) => ENTITIES[entity] ?? entity)
    .trim()
}

/** Parses WebVTT (the streamer converts SRT to it) into plain-text cues, sorted by start time. */
export function parseVtt(source: string): SubtitleCue[] {
  const cues: SubtitleCue[] = []
  for (const block of source.replace(/\r\n?/g, '\n').split(/\n{2,}/)) {
    const lines = block.split('\n')
    const timing = lines.findIndex((line) => line.includes('-->'))
    if (timing < 0) continue
    const [from, rest] = lines[timing].split('-->')
    const start = seconds(from)
    const end = seconds(rest.trim().split(/\s+/)[0] ?? '')
    const text = clean(lines.slice(timing + 1).join('\n'))
    if (Number.isFinite(start) && Number.isFinite(end) && text) cues.push({ start, end, text })
  }
  return cues.sort((a, b) => a.start - b.start)
}

/** A language's display name in the given locale, falling back to the raw code. */
export function languageName(code: string, locale: string): string {
  if (!code || code === 'und') return code
  try {
    return new Intl.DisplayNames([locale], { type: 'language' }).of(code.replace('_', '-')) ?? code
  } catch {
    return code
  }
}

/** The cue text showing at a playback time, or an empty string. Cues may overlap, so every active one is shown. */
export function cueTextAt(cues: SubtitleCue[], time: number): string {
  let text = ''
  for (const cue of cues) {
    if (cue.start > time) break
    if (time < cue.end) text += (text ? '\n' : '') + cue.text
  }
  return text
}
