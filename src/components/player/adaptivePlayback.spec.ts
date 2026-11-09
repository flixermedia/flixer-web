import { afterEach, describe, expect, it, vi } from 'vitest'

const { installAll, isBrowserSupported, listSettings, playerInstance, playerConstructor } = vi.hoisted(() => {
  const playerInstance = { configure: vi.fn(), destroy: vi.fn().mockResolvedValue(undefined) }
  const playerConstructor = vi.fn(function () {
    return playerInstance
  })
  const isBrowserSupported = vi.fn(() => true)
  Object.assign(playerConstructor, { isBrowserSupported })
  return { installAll: vi.fn(), isBrowserSupported, listSettings: vi.fn(), playerInstance, playerConstructor }
})

vi.mock('../../api/auth', () => ({ listSettings }))

vi.mock('shaka-player', () => ({
  default: {
    polyfill: { installAll },
    Player: playerConstructor,
    util: { Error: { Severity: { CRITICAL: 2 } } },
  },
}))

import {
  applyWidevinePlaybackSettings,
  configureWidevinePlayer,
  createShakaPlayer,
  destroyShakaPlayer,
  invalidateWidevinePlaybackSettings,
  isCriticalShakaError,
  isShakaSupported,
} from './adaptivePlayback'

describe('adaptivePlayback', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
    listSettings.mockReset()
    isBrowserSupported.mockReturnValue(true)
    invalidateWidevinePlaybackSettings()
  })

  it('installs Shaka polyfills once and creates a player for supported browsers', () => {
    vi.stubGlobal('window', {})

    expect(isShakaSupported()).toBe(true)
    expect(isShakaSupported()).toBe(true)
    expect(installAll).toHaveBeenCalledOnce()

    const video = {} as HTMLMediaElement
    expect(createShakaPlayer(video)).toBe(playerInstance)
    expect(playerConstructor).toHaveBeenCalledWith(video)
  })

  it('rejects unsupported browsers and recognizes only critical Shaka errors', () => {
    vi.stubGlobal('window', {})
    isBrowserSupported.mockReturnValue(false)

    expect(isShakaSupported()).toBe(false)
    expect(() => createShakaPlayer({} as HTMLMediaElement)).toThrow('Adaptive playback is not supported')
    expect(isCriticalShakaError(new CustomEvent('error', { detail: { severity: 2 } }))).toBe(true)
    expect(isCriticalShakaError(new CustomEvent('error', { detail: { severity: 1 } }))).toBe(false)
  })

  it('destroys a Shaka player asynchronously', async () => {
    await expect(destroyShakaPlayer(playerInstance as never)).resolves.toBeUndefined()
    expect(playerInstance.destroy).toHaveBeenCalledOnce()
    await expect(destroyShakaPlayer(null)).resolves.toBeUndefined()
  })

  it('configures Widevine only when it is enabled with a license server', async () => {
    applyWidevinePlaybackSettings(false, 'https://license.example/widevine')
    await configureWidevinePlayer(playerInstance as never)
    expect(playerInstance.configure).not.toHaveBeenCalled()

    applyWidevinePlaybackSettings(true, 'https://license.example/widevine')
    await configureWidevinePlayer(playerInstance as never)
    expect(playerInstance.configure).toHaveBeenCalledWith({
      drm: { servers: { 'com.widevine.alpha': 'https://license.example/widevine' } },
    })
  })

  it('uses newly applied settings when an older settings request is still pending', async () => {
    let resolveSettings!: (settings: { key: string; value: boolean | string }[]) => void
    listSettings.mockReturnValue(
      new Promise((resolve) => {
        resolveSettings = resolve
      }),
    )

    const configuring = configureWidevinePlayer(playerInstance as never)
    applyWidevinePlaybackSettings(true, 'https://license.example/new')
    resolveSettings([
      { key: 'widevine_drm_enabled', value: false },
      { key: 'widevine_license_server_url', value: 'https://license.example/old' },
    ])

    await configuring
    expect(playerInstance.configure).toHaveBeenCalledWith({
      drm: { servers: { 'com.widevine.alpha': 'https://license.example/new' } },
    })
  })
})
