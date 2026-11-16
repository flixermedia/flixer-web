import { describe, expect, it, vi } from 'vitest'
import { fetchPluginRepositoryImage } from './plugins'

const state = vi.hoisted(() => ({ native: true, get: vi.fn() }))
vi.mock('./client', () => ({ api: { get: state.get } }))
vi.mock('../platform/serverConnection', () => ({ isNativeApp: () => state.native }))

describe('plugin catalog artwork', () => {
  it('forces a server access check in the native app without changing web caching', async () => {
    state.get.mockResolvedValue({ data: new Blob(['image']) })
    state.native = true
    await fetchPluginRepositoryImage('repository', 'icon.png')
    expect(state.get.mock.calls[0][1].headers).toEqual({ 'Cache-Control': 'no-cache, no-store' })
    state.native = false
    await fetchPluginRepositoryImage('repository', 'icon.png')
    expect(state.get.mock.calls[1][1].headers).toBeUndefined()
  })
})
