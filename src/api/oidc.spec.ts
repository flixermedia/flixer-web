import { describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ put: vi.fn() }))
vi.mock('./client', () => ({ api: { put: mocks.put } }))

import { setOidcSubscriptionSharing } from './oidc'

describe('OIDC subscription sharing', () => {
  it('updates the selected client using an encoded identifier', async () => {
    mocks.put.mockResolvedValue({})
    await setOidcSubscriptionSharing('client / 1', true)
    expect(mocks.put).toHaveBeenCalledWith('/admin/oidc/clients/client%20%2F%201/subscription-sharing', { shareSubscription: true })
  })

  it('propagates failures to the caller', async () => {
    mocks.put.mockRejectedValue(new Error('Request failed'))
    await expect(setOidcSubscriptionSharing('client', false)).rejects.toThrow('Request failed')
  })
})
