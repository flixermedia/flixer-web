import { describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ put: vi.fn() }))
vi.mock('./client', () => ({ api: { put: mocks.put } }))

import { setOidcResourceScopes } from './oidc'

describe('OIDC resource permissions', () => {
  it('updates the selected client using an encoded identifier', async () => {
    mocks.put.mockResolvedValue({})
    await setOidcResourceScopes('client / 1', ['subscriptions:read'])
    expect(mocks.put).toHaveBeenCalledWith('/admin/oidc/clients/client%20%2F%201/resource-scopes', { scopes: ['subscriptions:read'] })
  })

  it('propagates failures to the caller', async () => {
    mocks.put.mockRejectedValue(new Error('Request failed'))
    await expect(setOidcResourceScopes('client', [])).rejects.toThrow('Request failed')
  })
})
