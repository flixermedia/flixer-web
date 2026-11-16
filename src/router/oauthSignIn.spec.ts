import { describe, expect, it } from 'vitest'
import { oauthInteractionPath, signInForRoute } from './oauthSignIn'

describe('OAuth sign-in routing', () => {
  it('sends an interaction to the OAuth sign-in page with its return path', () => {
    expect(signInForRoute('oauth-interaction', '/oauth/interaction/test_123')).toEqual({
      name: 'oauth-sign-in', query: { redirect: '/oauth/interaction/test_123' },
    })
    expect(signInForRoute('home', '/')).toEqual({ name: 'login', query: { redirect: '/' } })
  })

  it('only accepts local interaction paths for OAuth resumption', () => {
    expect(oauthInteractionPath('/oauth/interaction/test-123')).toBe('/oauth/interaction/test-123')
    for (const value of ['//evil.example', 'https://evil.example', '/oauth/interaction/../admin', '/oauth/interaction/test?next=x', '', undefined]) {
      expect(oauthInteractionPath(value)).toBeUndefined()
    }
  })

  it('opens registration for a TV registration link while preserving the approval destination', () => {
    const path = '/quick-connect?code=2ABC2345&register=1'
    expect(signInForRoute('quick-connect', path)).toEqual({ name: 'register', query: { redirect: path } })
    expect(signInForRoute('quick-connect', '/quick-connect?code=2ABC2345')).toEqual({
      name: 'login', query: { redirect: '/quick-connect?code=2ABC2345' },
    })
  })
})
