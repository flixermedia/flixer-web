export function oauthInteractionPath(value: unknown): string | undefined {
  return typeof value === 'string' && /^\/oauth\/interaction\/[\w-]{1,128}$/.test(value) ? value : undefined
}

export function signInForRoute(name: unknown, fullPath: string) {
  const registration = name === 'quick-connect' && fullPath.startsWith('/') && !fullPath.startsWith('//')
    && new URL(fullPath, 'https://flixer.invalid').searchParams.get('register') === '1'
  return {
    name: name === 'oauth-interaction' ? 'oauth-sign-in' : registration ? 'register' : 'login',
    query: { redirect: fullPath },
  }
}
