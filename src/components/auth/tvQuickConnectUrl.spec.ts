import { describe, expect, it } from 'vitest'
import { parseTvQuickConnectUrl, tvQuickConnectUrl } from './tvQuickConnectUrl'

describe('TV Quick Connect URL', () => {
  it('links to phone approval without including a polling token', () => {
    expect(tvQuickConnectUrl('https://flixer.example/path?old=1', '2ABC2345')).toBe('https://flixer.example/quick-connect?code=2ABC2345')
    expect(tvQuickConnectUrl('https://flixer.example', '2ABC2345', true)).toBe('https://flixer.example/quick-connect?code=2ABC2345&register=1')
  })

  it('rejects insecure or credential-bearing addresses', () => {
    for (const address of ['http://flixer.example', 'https://user:password@flixer.example', 'javascript:alert(1)']) {
      expect(() => tvQuickConnectUrl(address, '2ABC2345')).toThrow()
    }
    expect(tvQuickConnectUrl('http://localhost:5173', '2ABC2345')).toBe('http://localhost:5173/quick-connect?code=2ABC2345')
  })

  it('extracts the code and registration flag from a TV Quick Connect QR', () => {
    expect(parseTvQuickConnectUrl(tvQuickConnectUrl('https://flixer.example', '2ABC2345'))).toEqual({ code: '2ABC2345', registration: false })
    expect(parseTvQuickConnectUrl(tvQuickConnectUrl('https://flixer.example', '2ABC2345', true))).toEqual({ code: '2ABC2345', registration: true })
    expect(parseTvQuickConnectUrl('http://localhost:5173/quick-connect?code=2ABC2345')).toEqual({ code: '2ABC2345', registration: false })
  })

  it('rejects invalid or ambiguous Quick Connect QR codes', () => {
    for (const value of [
      'not a URL',
      'http://flixer.example/quick-connect?code=2ABC2345',
      'https://user:pass@flixer.example/quick-connect?code=2ABC2345',
      'https://flixer.example/other?code=2ABC2345',
      'https://flixer.example/quick-connect?code=2ABC2345#fragment',
      'https://flixer.example/quick-connect?code=2ABC2345&code=2ABC2345',
      'https://flixer.example/quick-connect?code=2ABC2345&register=1&register=1',
      'https://flixer.example/quick-connect?code=2ABC2345&register=0',
      'https://flixer.example/quick-connect?code=2ABC2345&redirect=https://example.com',
      'https://flixer.example/quick-connect?code=01IO2345',
    ])
      expect(parseTvQuickConnectUrl(value)).toBeNull()
  })
})
