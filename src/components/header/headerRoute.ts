export type HeaderRoute = {
  show: boolean
  showLinks: boolean
  docked: boolean
  disableScrollCollapse: boolean
}

const standardRoutes = new Set([
  'home', 'discover', 'requests', 'request-item', 'plugin-page', 'profile',
  'friend-invite', 'people', 'notifications', 'chat', 'issues', 'party',
  'playlist', 'media-item', 'person', 'movies', 'tv', 'music', 'guide', 'search',
])

const dockedRoutes = new Set(['admin', 'admin-activity', 'settings'])

export function getHeaderRoute(name: unknown, compact: boolean): HeaderRoute {
  const routeName = typeof name === 'string' ? name : ''
  const showLinks = standardRoutes.has(routeName)
  return {
    show: showLinks || dockedRoutes.has(routeName) || routeName === 'player-test',
    showLinks,
    docked: dockedRoutes.has(routeName) || (routeName === 'chat' && compact),
    disableScrollCollapse: routeName === 'guide',
  }
}
