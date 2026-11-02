import { beforeEach, describe, expect, it, vi } from 'vitest'
import { initNativeTextInteraction } from './textInteraction.ts'

const mocks = vi.hoisted(() => ({
  toggle: vi.fn(),
}))

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    getPlatform: () => 'ios',
    isNativePlatform: () => true,
  },
}))

vi.mock('@capgo/capacitor-textinteraction', () => ({
  TextInteraction: { toggle: mocks.toggle },
}))

describe('native text interaction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.toggle.mockResolvedValue({ success: true })
  })

  it('keeps iOS text inputs enabled', async () => {
    await initNativeTextInteraction()
    expect(mocks.toggle).toHaveBeenCalledWith({ enabled: true })
  })
})
