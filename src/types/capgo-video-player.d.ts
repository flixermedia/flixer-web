import type { PluginListenerHandle } from '@capacitor/core'

declare module '@capgo/capacitor-video-player' {
  interface NativeVideoPlayerEvent {
    currentTime?: number | string
    dismiss?: boolean
    fromPlayerId?: string
  }

  interface VideoPlayerPlugin {
    addListener(eventName: 'jeepCapVideoPlayerPlay' | 'jeepCapVideoPlayerPause' | 'jeepCapVideoPlayerReady' | 'jeepCapVideoPlayerEnded' | 'jeepCapVideoPlayerExit', listenerFunc: (event: NativeVideoPlayerEvent) => void): Promise<PluginListenerHandle>
  }
}
