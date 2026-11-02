import type { GuidePlaybackInfo } from '../api/guide'

export interface PendingLivePlayback {
  channelId: string
  title: string
  playback: GuidePlaybackInfo
}

let pendingPlayback: PendingLivePlayback | null = null

export function setPendingLivePlayback(playback: PendingLivePlayback): void {
  pendingPlayback = playback
}

export function takePendingLivePlayback(channelId: string): PendingLivePlayback | null {
  if (pendingPlayback?.channelId !== channelId) return null
  const playback = pendingPlayback
  pendingPlayback = null
  return playback
}

export function clearPendingLivePlayback(channelId: string): void {
  if (pendingPlayback?.channelId === channelId) pendingPlayback = null
}
