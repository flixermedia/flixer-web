function isSecureAppUrl(url: URL): boolean {
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
  return !url.username && !url.password && (url.protocol === 'https:' || (url.protocol === 'http:' && local))
}

export function tvQuickConnectUrl(appUrl: string, userCode: string, registration = false): string {
  const url = new URL(appUrl)
  if (!isSecureAppUrl(url)) {
    throw new Error('A secure Flixer application URL is required for TV sign-in.')
  }
  url.pathname = '/quick-connect'
  url.search = ''
  url.hash = ''
  url.searchParams.set('code', userCode)
  if (registration) url.searchParams.set('register', '1')
  return url.toString()
}

export function parseTvQuickConnectUrl(value: string): { code: string; registration: boolean } | null {
  let url: URL
  try {
    url = new URL(value)
  } catch {
    return null
  }
  const codes = url.searchParams.getAll('code')
  const registrations = url.searchParams.getAll('register')
  if (
    !isSecureAppUrl(url) ||
    url.pathname !== '/quick-connect' ||
    url.hash ||
    [...url.searchParams.keys()].some((key) => key !== 'code' && key !== 'register') ||
    codes.length !== 1 ||
    !/^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{8}$/.test(codes[0]) ||
    registrations.length > 1 ||
    (registrations.length === 1 && registrations[0] !== '1')
  )
    return null
  return { code: codes[0], registration: registrations.length === 1 }
}
