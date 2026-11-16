import { Capacitor, registerPlugin } from '@capacitor/core'
import type { PluginListenerHandle } from '@capacitor/core'

export interface TvSetupPairingResult {
  pairingUrl: string
  expiresAt: number
}

interface TvSetupPairingPlugin {
  startQuickSetup(): Promise<TvSetupPairingResult>
  stopQuickSetup(): Promise<void>
  addListener(eventName: 'quickSetupReceived', listener: (event: { serverUrl: string }) => void): Promise<PluginListenerHandle>
}

const tvSetupPairing = registerPlugin<TvSetupPairingPlugin>('FlixerTv')

export function isTvSetupPairingAvailable(): boolean {
  return Capacitor.isPluginAvailable('FlixerTv')
}

export function startTvQuickSetup(): Promise<TvSetupPairingResult> {
  return tvSetupPairing.startQuickSetup()
}

export function stopTvQuickSetup(): Promise<void> {
  return tvSetupPairing.stopQuickSetup()
}

export function listenForTvQuickSetup(listener: (event: { serverUrl: string }) => void): Promise<PluginListenerHandle> {
  return tvSetupPairing.addListener('quickSetupReceived', listener)
}
