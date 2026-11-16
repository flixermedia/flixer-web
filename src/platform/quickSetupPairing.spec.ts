import { describe, expect, it } from 'vitest'
import { getServerUrlFromApiBase, parseLocalQuickSetupPairingUrl } from './quickSetupPairing'

const token = 'a'.repeat(43)

describe('local quick setup pairing', () => {
  it('accepts a one-time pairing URL hosted on a private IPv4 address', () => {
    const url = parseLocalQuickSetupPairingUrl(`http://192.168.1.25:43210/pair?token=${token}`)
    expect(url?.hostname).toBe('192.168.1.25')
    expect(url?.port).toBe('43210')
  })

  it('rejects pairing URLs that could send setup data outside the local network', () => {
    for (const value of [
      `http://flixer.example.com:43210/pair?token=${token}`,
      `http://192.168.1.25:43210/other?token=${token}`,
      `http://192.168.1.25:43210/pair?token=short`,
      `http://192.168.1.25:43210/pair?token=${token}&redirect=https://example.com`,
      `https://192.168.1.25:43210/pair?token=${token}`,
    ]) {
      expect(parseLocalQuickSetupPairingUrl(value)).toBeNull()
    }
  })

  it('derives an HTTPS server URL from the API base while preserving a mount path', () => {
    expect(getServerUrlFromApiBase('/flixer/api/', 'https://flixer.example.com')).toBe('https://flixer.example.com/flixer')
    expect(getServerUrlFromApiBase('https://api.example.com/custom/api', 'https://web.example.com')).toBe('https://api.example.com/custom')
  })
})
