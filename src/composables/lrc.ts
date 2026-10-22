export interface LyricLine {
  /** Start time in seconds; null for unsynced lines. */
  time: number | null
  text: string
}

export interface ParsedLyrics {
  synced: boolean
  lines: LyricLine[]
}

const TIMESTAMP = /\[(\d{1,3}):(\d{1,2})(?:[.:](\d{1,3}))?\]/g
const META_TAG = /^\[[a-zA-Z]+:[^\]]*\]$/

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
    if (stamps.length === 0) {
      plain.push({ time: null, text: line })
      continue
    }
    const text = line.replace(TIMESTAMP, '').trim()
    for (const stamp of stamps) {
      const fraction = stamp[3] ? Number(`0.${stamp[3]}`) : 0
      synced.push({ time: Math.max(0, Number(stamp[1]) * 60 + Number(stamp[2]) + fraction - offset), text })
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
