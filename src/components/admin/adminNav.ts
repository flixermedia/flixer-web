/** Each top-level tab holds one or more pages. The first page is the tab's own; the others appear in its dropdown. */
export const ADMIN_TABS = {
  dashboard: ['overview'],
  library: ['libraries', 'tasks', 'media', 'transcoding'],
  providers: ['metadata', 'subtitles', 'themes'],
  requests: ['requests'],
  notifications: ['notifications', 'smtp'],
  apikeys: ['apikeys'],
  settings: ['server', 'users', 'networking', 'updates', 'backups'],
  plugins: ['plugins'],
} as const

export type AdminTabId = keyof typeof ADMIN_TABS
export type AdminPageId = (typeof ADMIN_TABS)[AdminTabId][number]

export interface AdminLocation {
  tab: AdminTabId
  page: AdminPageId
}

export const ADMIN_TAB_IDS = Object.keys(ADMIN_TABS) as AdminTabId[]

export function pagesOf(tab: AdminTabId): readonly AdminPageId[] {
  return ADMIN_TABS[tab]
}

/** Where links from before the dropdown navigation (a whole-page tab, or a single page of one) now lead. */
const LEGACY: Record<string, AdminLocation> = {
  overview: { tab: 'dashboard', page: 'overview' },
  streams: { tab: 'dashboard', page: 'overview' },
  logs: { tab: 'dashboard', page: 'overview' },
  libraries: { tab: 'library', page: 'libraries' },
  indexer: { tab: 'library', page: 'tasks' },
  tasks: { tab: 'library', page: 'tasks' },
  media: { tab: 'library', page: 'media' },
  transcoding: { tab: 'library', page: 'transcoding' },
  users: { tab: 'settings', page: 'users' },
  devices: { tab: 'settings', page: 'users' },
  general: { tab: 'settings', page: 'server' },
  updates: { tab: 'settings', page: 'updates' },
  backups: { tab: 'settings', page: 'backups' },
  plugins: { tab: 'plugins', page: 'plugins' },
}

function text(value: unknown): string {
  return Array.isArray(value) ? text(value[0]) : typeof value === 'string' ? value : ''
}

/** Works out the tab and page from the `tab` and `page` query values, falling back to the dashboard. */
export function resolveAdminLocation(tabQuery: unknown, pageQuery?: unknown): AdminLocation {
  const tab = text(tabQuery)
  const page = text(pageQuery)
  if ((ADMIN_TAB_IDS as string[]).includes(tab)) {
    const id = tab as AdminTabId
    const pages = pagesOf(id) as readonly string[]
    return { tab: id, page: (pages.includes(page) ? page : pages[0]) as AdminPageId }
  }
  return LEGACY[tab] ?? { tab: 'dashboard', page: 'overview' }
}

/** The tab a page lives in. */
export function tabOf(page: string): AdminTabId | null {
  return ADMIN_TAB_IDS.find((tab) => (ADMIN_TABS[tab] as readonly string[]).includes(page)) ?? null
}

/** The query that opens a page; the default page of a tab needs no `page`. */
export function adminQuery(tab: AdminTabId, page?: AdminPageId): Record<string, string> {
  return page && page !== pagesOf(tab)[0] ? { tab, page } : { tab }
}
