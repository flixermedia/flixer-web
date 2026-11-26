import { describe, expect, it } from 'vitest'
import { buildCloudflareZoneFile, groupDnsRecords, isMailUnconfigured, isValidMailTemplateSlug } from './mailHelpers'
import type { MailDnsRecord } from '../api/mail'

describe('mail helpers', () => {
  it('validates template slugs', () => {
    expect(isValidMailTemplateSlug('welcome-1')).toBe(true)
    expect(isValidMailTemplateSlug('a'.repeat(64))).toBe(true)
    expect(isValidMailTemplateSlug('-welcome')).toBe(false)
    expect(isValidMailTemplateSlug('welcome-')).toBe(false)
    expect(isValidMailTemplateSlug('Uppercase')).toBe(false)
  })

  it('groups DNS records by purpose without changing order', () => {
    const records: MailDnsRecord[] = [
      { purpose: 'ownership', type: 'TXT', name: 'challenge', value: 'token', required: true, note: '' },
      { purpose: 'mx', type: 'MX', name: 'example.com', value: 'mail.example.com', required: false, note: '' },
      { purpose: 'ownership', type: 'TXT', name: 'challenge2', value: 'token2', required: true, note: '' },
    ]
    expect(groupDnsRecords(records).map((group) => [group.purpose, group.records.length])).toEqual([['ownership', 2], ['mx', 1]])
  })

  it('detects when mail is unconfigured', () => {
    expect(isMailUnconfigured(null)).toBe(true)
    expect(isMailUnconfigured({ inbound: { listening: false, port: null, error: null }, outboundReady: false, sender: null, domains: { total: 0, verified: 0 }, userAddressesEnabled: false })).toBe(true)
    expect(isMailUnconfigured({ inbound: { listening: false, port: null, error: null }, outboundReady: true, sender: 'noreply@example.com', domains: { total: 1, verified: 1 }, userAddressesEnabled: false })).toBe(false)
    expect(isMailUnconfigured({ inbound: { listening: true, port: 2525, error: null }, outboundReady: false, sender: null, domains: { total: 0, verified: 0 }, userAddressesEnabled: false })).toBe(false)
  })

  it('builds a Cloudflare-compatible BIND zone file and chunks long TXT records', () => {
    const longDkim = `v=DKIM1; k=rsa; p=${'A'.repeat(280)}`
    const zone = buildCloudflareZoneFile({
      domain: 'example.com',
      records: [
        { purpose: 'ownership', type: 'TXT', name: '_flixer-verify', value: 'tok123', required: true, note: '' },
        { purpose: 'mx', type: 'MX', name: '@', value: 'mail.example.com', priority: 10, required: true, note: '' },
        { purpose: 'dkim', type: 'TXT', name: 'flixer._domainkey.example.com', value: longDkim, required: true, note: '' },
      ],
    })
    expect(zone).toContain('$ORIGIN example.com.')
    expect(zone).toContain('_flixer-verify.example.com. 300 IN TXT "tok123"')
    expect(zone).toContain('example.com. 300 IN MX 10 mail.example.com.')
    expect(zone).toContain('flixer._domainkey.example.com. 300 IN TXT "')
    expect(zone).toContain('" "')
  })
})
