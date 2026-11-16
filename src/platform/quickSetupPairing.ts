import { normalizeNativeServerUrl } from './serverConnection'

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/

function isPrivateIpv4(hostname: string): boolean {
  const octets = hostname.split('.').map(Number)
  if (octets.length !== 4 || octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)) return false

  const [first, second] = octets
  return first === 10 || (first === 172 && second >= 16 && second <= 31) || (first === 192 && second === 168)
}

export function parseLocalQuickSetupPairingUrl(value: string): URL | null {
  let url: URL
  try {
    url = new URL(value)
  } catch {
    return null
  }

  const tokens = url.searchParams.getAll('token')
  if (
    url.protocol !== 'http:' ||
    url.username ||
    url.password ||
    url.hash ||
    url.pathname !== '/pair' ||
    !isPrivateIpv4(url.hostname) ||
    !url.port ||
    [...url.searchParams.keys()].some((key) => key !== 'token') ||
    tokens.length !== 1 ||
    !TOKEN_PATTERN.test(tokens[0])
  ) {
    return null
  }

  return url
}

export function getServerUrlFromApiBase(apiBaseUrl: string, appOrigin: string): string {
  const apiUrl = new URL(apiBaseUrl, appOrigin)
  const pathname = apiUrl.pathname.replace(/\/+$/, '').replace(/\/api$/, '')
  return normalizeNativeServerUrl(`${apiUrl.origin}${pathname}`)
}
