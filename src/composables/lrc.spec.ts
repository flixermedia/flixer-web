import { describe, expect, it } from 'vitest'
import { instrumentalDotCount, isInstrumentalCue, karaokeWordState, parseLrc, type LyricLine } from './lrc.ts'

describe('parseLrc karaoke timestamps', () => {
  it('parses inline word timings and removes timestamp markup from lyric text', () => {
    const lyrics = parseLrc('[00:10.38]<00:10.38>Mama <00:11.14>always <00:11.80>told <00:12.16>me')

    expect(lyrics).toEqual({
      synced: true,
      lines: [
        {
          time: 10.38,
          text: 'Mama always told me',
          words: [
            { time: 10.38, text: 'Mama ' },
            { time: 11.14, text: 'always ' },
            { time: 11.8, text: 'told ' },
            { time: 12.16, text: 'me' },
          ],
        },
      ],
    })
  })

  it('supports karaoke timestamps without an outer LRC line timestamp', () => {
    expect(parseLrc('<00:01.00>Hello <00:02.00>world').lines).toMatchObject([
      { time: 1, text: 'Hello world', words: [{ time: 1 }, { time: 2 }] },
    ])
  })

  it('preserves ordinary line-timed LRC lyrics', () => {
    expect(parseLrc('[00:01.00]Hello world').lines).toEqual([{ time: 1, text: 'Hello world' }])
  })
})

describe('karaokeWordState', () => {
  const words = [
    { time: 10, text: 'first ' },
    { time: 11, text: 'second ' },
    { time: 12, text: 'third' },
  ]

  it('marks words upcoming, active, and complete based on playback time', () => {
    expect(karaokeWordState(words, 0, 9.99)).toBe('upcoming')
    expect(karaokeWordState(words, 0, 10.5)).toBe('active')
    expect(karaokeWordState(words, 0, 11)).toBe('complete')
    expect(karaokeWordState(words, 1, 11.5)).toBe('active')
  })

  it('treats words with tied timestamps as one active group', () => {
    const tiedWords = [{ time: 10, text: 'one ' }, { time: 10, text: 'two' }, { time: 11, text: 'three' }]

    expect(karaokeWordState(tiedWords, 0, 10.5)).toBe('active')
    expect(karaokeWordState(tiedWords, 1, 10.5)).toBe('active')
    expect(karaokeWordState(tiedWords, 0, 11)).toBe('complete')
  })
})

describe('isInstrumentalCue', () => {
  it.each(['', '   ', '♪', '♫', '♬', '♩'])('recognizes %j as an instrumental cue', (text) => {
    expect(isInstrumentalCue(text)).toBe(true)
  })

  it('does not mistake lyric text containing a note symbol for a cue', () => {
    expect(isInstrumentalCue('♪ Sing along')).toBe(false)
  })
})

describe('instrumentalDotCount', () => {
  const lines: LyricLine[] = [
    { time: 10, text: 'Previous lyric' },
    { time: 20, text: '♪' },
    { time: 25, text: '♪' },
    { time: 40, text: 'Next lyric' },
  ]

  it('lights the dots at 25%, 50%, and 75% of the instrumental gap', () => {
    expect(instrumentalDotCount(lines, 1, 24.9)).toBe(0)
    expect(instrumentalDotCount(lines, 1, 25)).toBe(1)
    expect(instrumentalDotCount(lines, 1, 30)).toBe(2)
    expect(instrumentalDotCount(lines, 1, 35)).toBe(3)
    expect(instrumentalDotCount(lines, 1, 40)).toBe(3)
  })

  it('does not light dots when the cue has no following timed lyric', () => {
    expect(instrumentalDotCount([{ time: 20, text: '♪' }], 0, 30)).toBe(0)
    expect(
      instrumentalDotCount(
        [
          { time: 20, text: '♪' },
          { time: null, text: 'Unsynced lyric' },
        ],
        0,
        30,
      ),
    ).toBe(0)
  })

  it('treats empty timestamped LRC lines as instrumental cues', () => {
    const lines = parseLrc('[00:20.00]\n[00:40.00]Next lyric').lines

    expect(isInstrumentalCue(lines[0].text)).toBe(true)
    expect(instrumentalDotCount(lines, 0, 30)).toBe(2)
  })
})
