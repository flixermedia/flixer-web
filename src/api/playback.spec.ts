import { afterEach, describe, expect, it, vi } from 'vitest'
import { buildAudioBitrateUrl, buildStreamUrl, detectCompatProfile, parseTrickplayPlaylist } from './playback.ts'

describe('detectCompatProfile', () => {
  afterEach(() => vi.unstubAllGlobals())

  function codecs(supported: string[]) {
    vi.stubGlobal('document', {
      createElement: () => ({ canPlayType: (type: string) => supported.includes(type) ? 'probably' : '' }),
    })
    vi.stubGlobal('MediaSource', { isTypeSupported: () => false })
  }

  it('uses H.264 and MP3 when AAC is unavailable', () => {
    codecs(['video/mp4; codecs="avc1.64001f,mp3"', 'video/webm; codecs="vp8,vorbis"'])
    expect(detectCompatProfile()).toBe('mp3')
    expect(buildStreamUrl('/streamer/stream/token', { compat: 'mp3', start: 5 })).toBe('/streamer/stream/token?compat=mp3&start=5.00')
  })

  it('keeps AAC when supported and retains the WebM fallback otherwise', () => {
    codecs(['video/mp4; codecs="avc1.64001f,mp4a.40.2"', 'video/mp4; codecs="avc1.64001f,mp3"'])
    expect(detectCompatProfile()).toBe('')
    codecs(['video/webm; codecs="vp8,vorbis"'])
    expect(detectCompatProfile()).toBe('vp8')
  })
})

describe('buildAudioBitrateUrl', () => {
  it('adds bitrate to relative and absolute stream URLs without dropping existing parameters', () => {
    expect(buildAudioBitrateUrl('/streamer/stream/token?quality=high', 320)).toBe('/streamer/stream/token?quality=high&audioBitrate=320')
    expect(buildAudioBitrateUrl('https://flixer.test/streamer/stream/token', 192)).toBe('https://flixer.test/streamer/stream/token?audioBitrate=192')
  })
})

describe('parseTrickplayPlaylist', () => {
  it('reads HLS image tile metadata and resolves relative image URLs', () => {
    const playlist = `#EXTM3U
#EXT-X-IMAGES-ONLY
#EXTINF:100.000,
#EXT-X-TILES:RESOLUTION=320x180,LAYOUT=10x10,DURATION=1.000
320/0.jpg
#EXTINF:30.000,
#EXT-X-TILES:RESOLUTION=320x180,LAYOUT=10x10,DURATION=1.000
320/1.jpg
#EXT-X-ENDLIST`

    const trickplay = parseTrickplayPlaylist(playlist, 'https://flixer.test/streamer/trickplay/token/tiles.m3u8')

    expect(trickplay?.manifest).toEqual({
      intervalMs: 1000,
      thumbWidth: 320,
      thumbHeight: 180,
      columns: 10,
      rows: 10,
      count: 130,
      sheets: 2,
    })
    expect(trickplay?.sheetUrl(0)).toBe('https://flixer.test/streamer/trickplay/token/320/0.jpg')
    expect(trickplay?.sheetUrl(1)).toBe('https://flixer.test/streamer/trickplay/token/320/1.jpg')

    const sameOriginTrickplay = parseTrickplayPlaylist(playlist, '/streamer/trickplay/token/tiles.m3u8')
    expect(sameOriginTrickplay?.sheetUrl(0)).toBe('http://localhost/streamer/trickplay/token/320/0.jpg')
  })

  it('returns null for incomplete playlists', () => {
    expect(parseTrickplayPlaylist('#EXTM3U\n#EXTINF:100.000,\n0.jpg', 'https://flixer.test/tiles.m3u8')).toBeNull()
  })

  it('parses Jellyscrub frame playlists as individual thumbnails', () => {
    const playlist = `#EXTM3U
#EXT-X-IMAGES-ONLY
#EXTINF:1.000,
#EXT-X-TILES:RESOLUTION=320x180,LAYOUT=1x1,DURATION=1.000
320/0.jpg
#EXTINF:1.000,
#EXT-X-TILES:RESOLUTION=320x180,LAYOUT=1x1,DURATION=1.000
320/1.jpg
#EXT-X-ENDLIST`

    const trickplay = parseTrickplayPlaylist(playlist, 'https://flixer.test/streamer/trickplay/token/tiles.m3u8')

    expect(trickplay?.manifest).toEqual({
      intervalMs: 1000,
      thumbWidth: 320,
      thumbHeight: 180,
      columns: 1,
      rows: 1,
      count: 2,
      sheets: 2,
    })
    expect(trickplay?.sheetUrl(0)).toBe('https://flixer.test/streamer/trickplay/token/320/0.jpg')
    expect(trickplay?.sheetUrl(1)).toBe('https://flixer.test/streamer/trickplay/token/320/1.jpg')
  })
})
