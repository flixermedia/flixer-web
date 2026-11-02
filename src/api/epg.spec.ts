import { describe, expect, it } from 'vitest'
import { parseXmltvTimestamp, programmeProgress, programmesInWindow, visibleGuideTimeChunks, type EpgProgramme } from './epg'

describe('XMLTV programme guide helpers', () => {
  it('parses timestamps with UTC and explicit offsets', () => {
    expect(parseXmltvTimestamp('20261031200000 +0000')).toBe(Date.UTC(2026, 9, 31, 20))
    expect(parseXmltvTimestamp('20261101010000 +0100')).toBe(Date.UTC(2026, 10, 1, 0))
    expect(parseXmltvTimestamp('20261031200000 -0500')).toBe(Date.UTC(2026, 9, 31, 20) + 5 * 60 * 60_000)
  })

  it('rejects malformed or out-of-range timestamps', () => {
    expect(parseXmltvTimestamp('not a timestamp')).toBeUndefined()
    expect(parseXmltvTimestamp('20260230000000 +0000')).toBeUndefined()
    expect(parseXmltvTimestamp('20261031246000 +0000')).toBeUndefined()
  })

  it('returns programmes that overlap a guide window', () => {
    const programmes: EpgProgramme[] = [
      { channelId: 'one', start: 0, stop: 10, title: 'Earlier' },
      { channelId: 'one', start: 10, stop: 20, title: 'Inside' },
      { channelId: 'one', start: 20, stop: 30, title: 'Later' },
    ]
    expect(programmesInWindow(programmes, 5, 25).map((programme) => programme.title)).toEqual(['Earlier', 'Inside', 'Later'])
    expect(programmesInWindow(programmes, 10, 20).map((programme) => programme.title)).toEqual(['Inside'])
  })

  it('returns the visible six-hour time chunks and one chunk ahead', () => {
    const windowDuration = 7 * 24 * 60 * 60_000
    const chunkDuration = 6 * 60 * 60_000
    const timelineWidth = 48_384

    expect(visibleGuideTimeChunks(0, 1_200, timelineWidth, windowDuration, chunkDuration)).toEqual([0, 1])
    expect(visibleGuideTimeChunks(1_728, 1_200, timelineWidth, windowDuration, chunkDuration)).toEqual([1, 2])
    expect(visibleGuideTimeChunks(timelineWidth - 1_000, 1_200, timelineWidth, windowDuration, chunkDuration)).toEqual([27])
    expect(visibleGuideTimeChunks(0, 1_200, 0, windowDuration, chunkDuration)).toEqual([])
  })

  it('clamps a programme progress value to its schedule', () => {
    const programme: EpgProgramme = { channelId: 'one', start: 100, stop: 200, title: 'Show' }
    expect(programmeProgress(programme, 50)).toBe(0)
    expect(programmeProgress(programme, 150)).toBe(50)
    expect(programmeProgress(programme, 250)).toBe(100)
  })
})
