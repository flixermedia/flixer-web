import type { MailDnsRecord, MailDomain, MailStatus } from '../api/mail'

export function isValidMailTemplateSlug(value: string): boolean {
  return /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/.test(value)
}

export function groupDnsRecords(records: MailDnsRecord[]): Array<{ purpose: MailDnsRecord['purpose']; records: MailDnsRecord[] }> {
  const groups = new Map<MailDnsRecord['purpose'], MailDnsRecord[]>()
  for (const record of records) groups.set(record.purpose, [...(groups.get(record.purpose) ?? []), record])
  return [...groups].map(([purpose, grouped]) => ({ purpose, records: grouped }))
}

export function isMailUnconfigured(status: MailStatus | null | undefined): boolean {
  if (!status) return true
  return status.domains.verified === 0 && !status.outboundReady && !status.inbound.listening
}

function toFqdn(name: string, rootDomain: string): string {
  const clean = name.trim().replace(/\.+$/, '')
  const root = rootDomain.trim().replace(/\.+$/, '')
  if (!clean || clean === '@') return `${root}.`
  if (clean === root || clean.endsWith(`.${root}`)) return `${clean}.`
  return `${clean}.${root}.`
}

function formatTxtValue(value: string): string {
  const escaped = value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
  const chunks: string[] = []
  for (let i = 0; i < escaped.length; i += 255) {
    chunks.push(`"${escaped.slice(i, i + 255)}"`)
  }
  return chunks.length ? chunks.join(' ') : '""'
}

/**
 * Generates a BIND zone file from a domain's DNS records for Cloudflare's
 * "Import DNS records" flow.
 */
export function buildCloudflareZoneFile(domain: Pick<MailDomain, 'domain' | 'records'>): string {
  const root = domain.domain.trim().replace(/\.+$/, '')
  const lines = [`$ORIGIN ${root}.`, `$TTL 300`]
  for (const record of domain.records) {
    const host = toFqdn(record.name, root)
    if (record.type === 'MX') {
      lines.push(`${host} 300 IN MX ${record.priority ?? 10} ${toFqdn(record.value, root)}`)
    } else {
      lines.push(`${host} 300 IN TXT ${formatTxtValue(record.value)}`)
    }
  }
  return `${lines.join('\n')}\n`
}

export function downloadCloudflareZoneFile(domain: Pick<MailDomain, 'domain' | 'records'>): string {
  const content = buildCloudflareZoneFile(domain)
  if (typeof document !== 'undefined' && typeof URL.createObjectURL === 'function') {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${domain.domain}-cloudflare-dns.txt`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }
  return content
}
