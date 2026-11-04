import { describe, expect, it } from 'vitest'
import { groupDnsRecords, isValidMailTemplateSlug } from './mailHelpers'
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
})
