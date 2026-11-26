import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../api/admin', () => ({
  listAdminScheduledTasks: vi.fn().mockResolvedValue([
    { id: 'task-1', name: 'Scan Libraries', category: 'Media', description: 'Scans media folders', enabled: true, cron: '0 * * * *', state: 'idle', lastRunAt: null },
  ]),
  listAdminUsers: vi.fn().mockResolvedValue([
    { id: 'user-1', username: 'alice', email: 'alice@example.com', role: 'admin', enabled: true },
  ]),
  listApiKeys: vi.fn().mockResolvedValue([
    { id: 'key-1', name: 'Automation Key', prefix: 'flx_1234', createdAt: '2026-01-01T00:00:00Z', lastUsedAt: null },
  ]),
}))

vi.mock('../api/invites', () => ({
  listInvitations: vi.fn().mockResolvedValue([
    { id: 'inv-1', code: 'WELCOME', label: 'Friends', server: null, maxUses: 5, usedCount: 1, expiresAt: null, disabled: false, libraryMode: 'all', libraryIds: [], externalLibraryIds: [], allowDownloads: true, skipPayment: false, skipEmailVerification: false, disablePlexOnlineSources: false, userExpiresInDays: null, createdAt: '', updatedAt: '' },
  ]),
}))

vi.mock('../api/media', () => ({
  listMediaLibraries: vi.fn().mockResolvedValue([
    { id: 'lib-1', name: '4K Movies', type: 'movies', folders: [{ rootId: 'root-1', path: 'movies', location: '/media/movies', available: true }] },
  ]),
  listNetworkShares: vi.fn().mockResolvedValue([
    { id: 'share-1', name: 'NAS Media', protocol: 'smb', host: 'nas.local' },
  ]),
}))

vi.mock('../api/oidc', () => ({
  listOidcClients: vi.fn().mockResolvedValue([
    { id: 'oidc-1', name: 'Grafana SSO', redirectUris: ['https://grafana.local/callback'], type: 'confidential', resourceScopes: ['openid'], createdAt: '' },
  ]),
}))

vi.mock('../api/plugins', () => ({
  listPluginInstallations: vi.fn().mockResolvedValue([
    { id: 'plugin-1', version: '1.2.0', enabled: true, manifest: { name: 'Trakt Sync', description: 'Sync watch history' } },
  ]),
}))

import { isAdminCommandShortcut, useAdminCommandPalette } from './useAdminCommandPalette'

describe('useAdminCommandPalette', () => {
  beforeEach(() => {
    const store = new Map<string, string>()
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, value),
      removeItem: (key: string) => store.delete(key),
      clear: () => store.clear(),
    })
    const { close } = useAdminCommandPalette()
    close()
  })

  it('recognizes Cmd+Space and Ctrl+Space shortcuts without Alt or Shift', () => {
    expect(isAdminCommandShortcut({ metaKey: true, ctrlKey: false, altKey: false, shiftKey: false, code: 'Space', key: ' ' } as KeyboardEvent)).toBe(true)
    expect(isAdminCommandShortcut({ metaKey: false, ctrlKey: true, altKey: false, shiftKey: false, code: 'Space', key: ' ' } as KeyboardEvent)).toBe(true)
    expect(isAdminCommandShortcut({ metaKey: true, ctrlKey: false, altKey: true, shiftKey: false, code: 'Space', key: ' ' } as KeyboardEvent)).toBe(false)
    expect(isAdminCommandShortcut({ metaKey: false, ctrlKey: true, altKey: false, shiftKey: true, code: 'Space', key: ' ' } as KeyboardEvent)).toBe(false)
    expect(isAdminCommandShortcut({ metaKey: false, ctrlKey: false, altKey: false, shiftKey: false, code: 'Space', key: ' ' } as KeyboardEvent)).toBe(false)
  })

  it('toggles open state and loads live admin items', async () => {
    const palette = useAdminCommandPalette()
    expect(palette.isOpen.value).toBe(false)

    palette.toggle()
    expect(palette.isOpen.value).toBe(true)

    await palette.loadLiveItems(true)
    const ids = palette.liveItems.value.map((item) => item.id)
    expect(ids).toContain('live:library:lib-1')
    expect(ids).toContain('live:user:user-1')
    expect(ids).toContain('live:plugin:plugin-1')
    expect(ids).toContain('live:task:task-1')
    expect(ids).toContain('live:oauth:oidc-1')
    expect(ids).toContain('live:apikey:key-1')
    expect(ids).toContain('live:invite:inv-1')
    expect(ids).toContain('live:share:share-1')

    palette.close()
    expect(palette.isOpen.value).toBe(false)
  })

  it('navigates and records recent items when executing a command', async () => {
    const palette = useAdminCommandPalette()
    const replace = vi.fn().mockResolvedValue(undefined)
    const push = vi.fn().mockResolvedValue(undefined)
    const router = {
      currentRoute: { value: { name: 'admin' } },
      replace,
      push,
    } as never

    palette.open()
    await palette.executeCommand(
      {
        id: 'live:plugin:plugin-1',
        kind: 'plugin',
        title: 'Trakt Sync',
        category: 'Plugins',
        icon: 'lucide:puzzle',
        keywords: ['trakt'],
        tab: 'plugins',
        page: 'plugins',
        pluginId: 'plugin-1',
      },
      router,
    )

    expect(palette.isOpen.value).toBe(false)
    expect(palette.recentIds.value[0]).toBe('live:plugin:plugin-1')
    expect(replace).toHaveBeenCalledWith({ query: { tab: 'plugins', plugin: 'plugin-1' } })
  })
})
