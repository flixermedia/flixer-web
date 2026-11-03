export interface LyricLine {
  /** Start time in seconds; null for unsynced lines. */
  time: number | null
  text: string
  words?: LyricWord[]
}

export interface LyricWord {
  /** Absolute start time in seconds from an inline karaoke timestamp. */
  time: number
  text: string
}

export interface ParsedLyrics {
  synced: boolean
  lines: LyricLine[]
}

const TIMESTAMP = /\[(\d{1,3}):(\d{1,2})(?:[.:](\d{1,3}))?\]/g
const META_TAG = /^\[[a-zA-Z]+:[^\]]*\]$/
const KARAOKE_TIMESTAMP = /<(\d{1,3}):(\d{1,2})(?:[.:](\d{1,3}))?>/g
const INSTRUMENTAL_CUE = /^[♪♫♬♩𝅘𝅥𝅮𝅘𝅥𝅯𝅘𝅥𝅰𝅘𝅥𝅱𝅘𝅥𝅲]*$/u

function timestampSeconds(minutes: string, seconds: string, fraction: string | undefined, offset: number): number {
  return Math.max(0, Number(minutes) * 60 + Number(seconds) + (fraction ? Number(`0.${fraction}`) : 0) - offset)
}

function parseKaraokeWords(text: string, offset: number): LyricWord[] | undefined {
  const timestamps = [...text.matchAll(KARAOKE_TIMESTAMP)]
  if (timestamps.length === 0) return undefined

  const words: LyricWord[] = []
  for (let index = 0; index < timestamps.length; index++) {
    const timestamp = timestamps[index]
    const start = timestamp.index! + timestamp[0].length
    const end = timestamps[index + 1]?.index ?? text.length
    const wordText = `${index === 0 ? text.slice(0, timestamp.index) : ''}${text.slice(start, end)}`
    if (!wordText) continue
    words.push({
      time: timestampSeconds(timestamp[1], timestamp[2], timestamp[3], offset),
      text: wordText,
    })
  }
  return words.length > 0 ? words : undefined
}

/** Returns true for empty LRC cues and lines containing only musical note symbols. */
export function isInstrumentalCue(text: string): boolean {
  return INSTRUMENTAL_CUE.test(text.trim())
}

/** Parses LRC text (including multi-timestamp lines and the [offset:] tag). Plain text becomes unsynced lines. */
export function parseLrc(source: string): ParsedLyrics {
  const offsetMatch = /\[offset:\s*(-?\d+)\s*\]/i.exec(source)
  const offset = offsetMatch ? Number(offsetMatch[1]) / 1000 : 0
  const synced: LyricLine[] = []
  const plain: LyricLine[] = []

  for (const raw of source.split(/\r?\n/)) {
    const line = raw.trim()
    if (!line || META_TAG.test(line)) continue
    const stamps = [...line.matchAll(TIMESTAMP)]
    const text = line.replace(TIMESTAMP, '').trim()
    const words = parseKaraokeWords(text, offset)
    if (stamps.length === 0) {
      if (words) {
        synced.push({
          time: words[0].time,
          text: words.map((word) => word.text).join('').trim(),
          words,
        })
      } else {
        plain.push({ time: null, text })
      }
      continue
    }

    const lyricText = words ? words.map((word) => word.text).join('').trim() : text
    for (const stamp of stamps) {
      synced.push({
        time: timestampSeconds(stamp[1], stamp[2], stamp[3], offset),
        text: lyricText,
        ...(words ? { words } : {}),
      })
    }
  }

  if (synced.length > 0) {
    synced.sort((a, b) => (a.time ?? 0) - (b.time ?? 0))
    return { synced: true, lines: synced }
  }
  return { synced: false, lines: plain }
}

/** Index of the line being sung at `time`, or -1 before the first line. */
export function activeLineIndex(lines: LyricLine[], time: number): number {
  let low = 0
  let high = lines.length - 1
  let found = -1
  while (low <= high) {
    const mid = (low + high) >> 1
    if ((lines[mid].time ?? 0) <= time) {
      found = mid
      low = mid + 1
    } else {
      high = mid - 1
    }
  }
  return found
}

/** Whether a timed word is upcoming, currently active, or already sung. */
export function karaokeWordState(words: LyricWord[], index: number, time: number): 'upcoming' | 'active' | 'complete' {
  const word = words[index]
  if (!word || time < word.time) return 'upcoming'

  const nextDistinctWord = words.slice(index + 1).find((candidate) => candidate.time > word.time)
  return nextDistinctWord && time >= nextDistinctWord.time ? 'complete' : 'active'
}

/** Counts how many instrumental cue dots should be lit before the next lyric line. */
export function instrumentalDotCount(lines: LyricLine[], index: number, time: number): number {
  const cue = lines[index]
  if (!cue || cue.time === null || !isInstrumentalCue(cue.text)) return 0

  const nextLyric = lines.slice(index + 1).find((line) => !isInstrumentalCue(line.text) && line.time !== null)
  if (!nextLyric || nextLyric.time === null || nextLyric.time <= cue.time) return 0

  const progress = Math.max(0, Math.min(1, (time - cue.time) / (nextLyric.time - cue.time)))
  return Math.min(3, Math.floor(progress * 4))
}
