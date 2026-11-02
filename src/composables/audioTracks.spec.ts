import { describe, expect, it } from 'vitest'
import { audioTrackLabel, preferredAudioTrack, selectedAudioStreamIndex } from './audioTracks'
import type { AudioTrack } from '../api/playback'

const tracks: AudioTrack[] = [
  { index: 1, codec: 'aac', language: 'eng', title: 'Stereo', channels: 2, default: true },
  { index: 3, codec: 'ac3', language: 'jpn', title: 'Surround', channels: 6, default: false },
]

describe('audio track selection', () => {
  it('matches ISO language names and ignores regional subtags', () => {
    expect(preferredAudioTrack(tracks, 'ja-JP')).toBe(tracks[1])
    expect(preferredAudioTrack(tracks, 'en-GB')).toBe(tracks[0])
  })

  it('falls back to the marked default and then the first track', () => {
    expect(preferredAudioTrack(tracks, 'fr')).toBe(tracks[0])
    expect(preferredAudioTrack([{ ...tracks[0], default: false }])).toMatchObject({ index: 1 })
  })

  it('only requests an explicit index for a non-first audio stream', () => {
    expect(selectedAudioStreamIndex(tracks, 1)).toBeUndefined()
    expect(selectedAudioStreamIndex(tracks, 3)).toBe(3)
    expect(selectedAudioStreamIndex(tracks, null)).toBeUndefined()
  })

  it('labels tracks with language, title, and channel count', () => {
    expect(audioTrackLabel(tracks[1], 'en')).toBe('Japanese · Surround · 6 ch')
  })
})
