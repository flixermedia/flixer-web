export type AdminSectionId = 'overview' | 'streams' | 'logs' | 'libraries' | 'media' | 'indexer' | 'providers' | 'apikeys' | 'users' | 'devices' | 'notifications' | 'updates' | 'backups' | 'general' | 'transcoding' | 'tasks'
export type AdminGroupId = 'dashboard' | 'library' | 'media' | 'providers' | 'transcoding' | 'apikeys' | 'users' | 'notifications' | 'updates' | 'backups' | 'settings'

/** Each group is one tab; the pages inside it are stacked on a single screen. */
export const ADMIN_GROUPS: Record<AdminGroupId, AdminSectionId[]> = {
  dashboard: ['overview', 'streams', 'logs'],
  library: ['libraries', 'indexer'],
  media: ['media'],
  providers: ['providers'],
  transcoding: ['transcoding'],
  apikeys: ['apikeys'],
  users: ['users', 'devices'],
  notifications: ['notifications'],
  updates: ['updates'],
  backups: ['backups'],
  settings: ['general', 'tasks'],
}

const GROUP_IDS = Object.keys(ADMIN_GROUPS) as AdminGroupId[]

export function groupOf(section: string): AdminGroupId | null {
  return GROUP_IDS.find((group) => (ADMIN_GROUPS[group] as string[]).includes(section)) ?? null
}

/** Accepts a group, or an old single-page tab such as `indexer`, so existing links keep working. */
export function resolveAdminGroup(tab: unknown): AdminGroupId {
  const requested = typeof tab === 'string' ? tab : ''
  return (GROUP_IDS as string[]).includes(requested) ? (requested as AdminGroupId) : (groupOf(requested) ?? 'dashboard')
}
