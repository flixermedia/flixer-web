import type { MailDnsRecord } from '../api/mail'

export function isValidMailTemplateSlug(value: string): boolean {
  return /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/.test(value)
}

export function groupDnsRecords(records: MailDnsRecord[]): Array<{ purpose: MailDnsRecord['purpose']; records: MailDnsRecord[] }> {
  const groups = new Map<MailDnsRecord['purpose'], MailDnsRecord[]>()
  for (const record of records) groups.set(record.purpose, [...(groups.get(record.purpose) ?? []), record])
  return [...groups].map(([purpose, grouped]) => ({ purpose, records: grouped }))
}
