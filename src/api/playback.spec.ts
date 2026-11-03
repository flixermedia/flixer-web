import { describe, expect, it } from 'vitest'
import { parseTrickplayPlaylist } from './playback.ts'

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
