export function oauthInteractionPath(value: unknown): string | undefined {
  return typeof value === 'string' && /^\/oauth\/interaction\/[\w-]{1,128}$/.test(value) ? value : undefined
}

export function signInForRoute(name: unknown, fullPath: string) {
  return {
    name: name === 'oauth-interaction' ? 'oauth-sign-in' : 'login',
    query: { redirect: fullPath },
  }
}
