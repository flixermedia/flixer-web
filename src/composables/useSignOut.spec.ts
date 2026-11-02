import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useSignOut } from './useSignOut.ts'

const mocks = vi.hoisted(() => ({
  clearAccessToken: vi.fn(),
  clearPluginPages: vi.fn(),
  close: vi.fn(),
  error: vi.fn(),
  leave: vi.fn(),
  logout: vi.fn(),
  profileClear: vi.fn(),
  reload: vi.fn(),
  stop: vi.fn(),
}))

vi.mock('../api', () => ({
  clearAccessToken: mocks.clearAccessToken,
  logout: mocks.logout,
}))

vi.mock('./notify', () => ({
  notify: { error: mocks.error },
}))

vi.mock('./useAudioPlayer', () => ({
  useAudioPlayer: () => ({ stop: mocks.stop }),
}))

vi.mock('./useParty', () => ({
  useParty: () => ({ leave: mocks.leave }),
}))

vi.mock('./usePluginPages', () => ({
  clearPluginPages: mocks.clearPluginPages,
}))

vi.mock('./useProfile', () => ({
  useProfile: () => ({ clear: mocks.profileClear }),
}))

vi.mock('./useVideoOverlay', () => ({
  useVideoOverlay: () => ({ close: mocks.close }),
}))

describe('useSignOut', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('window', { location: { replace: mocks.reload } })
    mocks.leave.mockResolvedValue(undefined)
    mocks.logout.mockResolvedValue(undefined)
  })

  it('clears local session and navigates to login if server logout returns 401', async () => {
    mocks.logout.mockRejectedValue(
      Object.assign(new Error('Unauthorized'), {
        isAxiosError: true,
        response: { status: 401 },
      }),
    )
    const { isSigningOut, signOut } = useSignOut()

    await signOut()

    expect(mocks.clearAccessToken).toHaveBeenCalledOnce()
    expect(mocks.profileClear).toHaveBeenCalledOnce()
    expect(mocks.clearPluginPages).toHaveBeenCalledOnce()
    expect(mocks.reload).toHaveBeenCalledWith('/login')
    expect(mocks.error).not.toHaveBeenCalled()
    expect(isSigningOut.value).toBe(false)
  })

  it('continues signing out if stopping media fails', async () => {
    mocks.stop.mockImplementation(() => {
      throw new Error('Could not stop media')
    })
    const { signOut } = useSignOut()

    await signOut()

    expect(mocks.logout).toHaveBeenCalledOnce()
    expect(mocks.clearAccessToken).toHaveBeenCalledOnce()
    expect(mocks.profileClear).toHaveBeenCalledOnce()
    expect(mocks.reload).toHaveBeenCalledWith('/login')
    expect(mocks.error).toHaveBeenCalledOnce()
  })

  it('navigates directly to the login route without relying on Vue Router', async () => {
    const { signOut } = useSignOut()

    await signOut()

    expect(mocks.reload).toHaveBeenCalledWith('/login')
  })

  afterEach(() => vi.unstubAllGlobals())
})
