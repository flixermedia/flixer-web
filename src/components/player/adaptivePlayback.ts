import shaka from 'shaka-player'
import { listSettings } from '../../api/auth'

let polyfillsInstalled = false
let widevineSettings: Promise<{ enabled: boolean; licenseServerUrl: string }> | undefined

export function isShakaSupported(): boolean {
  if (typeof window === 'undefined') return false
  if (!polyfillsInstalled) {
    shaka.polyfill.installAll()
    polyfillsInstalled = true
  }
  return shaka.Player.isBrowserSupported()
}

export function createShakaPlayer(video: HTMLMediaElement): shaka.Player {
  if (!isShakaSupported()) throw new Error('Adaptive playback is not supported in this browser.')
  return new shaka.Player(video)
}

export function applyWidevinePlaybackSettings(enabled: boolean, licenseServerUrl: string) {
  widevineSettings = Promise.resolve({ enabled, licenseServerUrl })
}

async function getWidevinePlaybackSettings() {
  if (!widevineSettings) {
    widevineSettings = listSettings()
      .then((settings) => {
        const enabled = settings.find((setting) => setting.key === 'widevine_drm_enabled')?.value
        const licenseServerUrl = settings.find((setting) => setting.key === 'widevine_license_server_url')?.value
        return {
          enabled: enabled === true,
          licenseServerUrl: typeof licenseServerUrl === 'string' ? licenseServerUrl : '',
        }
      })
      .catch((error: unknown) => {
        widevineSettings = undefined
        console.error('[playback] could not load Widevine settings', error)
        return { enabled: false, licenseServerUrl: '' }
      })
  }
  return widevineSettings
}

export async function configureWidevinePlayer(player: shaka.Player) {
  const { enabled, licenseServerUrl } = await getWidevinePlaybackSettings()
  if (enabled && licenseServerUrl) {
    player.configure({ drm: { servers: { 'com.widevine.alpha': licenseServerUrl } } })
  }
}

export function isCriticalShakaError(event: Event): boolean {
  const error = (event as CustomEvent<shaka.util.Error>).detail
  return error?.severity === shaka.util.Error.Severity.CRITICAL
}

export function destroyShakaPlayer(player: shaka.Player | null | undefined): Promise<void> {
  return player ? player.destroy().then(() => undefined) : Promise.resolve()
}
