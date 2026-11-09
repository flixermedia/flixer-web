import shaka from 'shaka-player'
import { listSettings } from '../../api/auth'

let polyfillsInstalled = false
type WidevineSettings = { enabled: boolean; licenseServerUrl: string }

let widevineSettings: WidevineSettings | undefined
let widevineSettingsRequest: Promise<WidevineSettings> | undefined
let widevineSettingsVersion = 0

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
  invalidateWidevinePlaybackSettings()
  widevineSettings = { enabled, licenseServerUrl }
}

export function invalidateWidevinePlaybackSettings() {
  widevineSettingsVersion++
  widevineSettings = undefined
  widevineSettingsRequest = undefined
}

async function getWidevinePlaybackSettings(): Promise<WidevineSettings> {
  if (widevineSettings) return widevineSettings
  if (!widevineSettingsRequest) {
    const requestVersion = widevineSettingsVersion
    const request = listSettings()
      .then((settings) => {
        const enabled = settings.find((setting) => setting.key === 'widevine_drm_enabled')?.value
        const licenseServerUrl = settings.find((setting) => setting.key === 'widevine_license_server_url')?.value
        return {
          enabled: enabled === true,
          licenseServerUrl: typeof licenseServerUrl === 'string' ? licenseServerUrl : '',
        }
      })
      .then(
        (settings) => {
          if (requestVersion === widevineSettingsVersion) {
            widevineSettings = settings
            widevineSettingsRequest = undefined
          }
          return settings
        },
        (error: unknown) => {
          if (requestVersion === widevineSettingsVersion && widevineSettingsRequest === request) {
            widevineSettingsRequest = undefined
          }
          console.error('[playback] could not load Widevine settings', error)
          return { enabled: false, licenseServerUrl: '' }
        },
      )
    widevineSettingsRequest = request
  }
  const requestVersion = widevineSettingsVersion
  const settings = await widevineSettingsRequest
  return requestVersion === widevineSettingsVersion ? settings : getWidevinePlaybackSettings()
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
