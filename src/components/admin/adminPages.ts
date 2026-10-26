import { defineAsyncComponent, type Component } from 'vue'
import type { StaticAdminPageId } from './adminNav'

const lazy = (load: () => Promise<{ default: Component }>) => defineAsyncComponent(load)

const Dashboard = lazy(() => import('./DashboardPanel.vue'))
const Libraries = lazy(() => import('./LibrariesPanel.vue'))
const IndexerQueues = lazy(() => import('./IndexerQueuesSection.vue'))
const IndexerTasks = lazy(() => import('./IndexerTasksSection.vue'))
const Tasks = lazy(() => import('./TasksPanel.vue'))
const Media = lazy(() => import('./MediaPanel.vue'))
const Transcoding = lazy(() => import('./TranscodingPanel.vue'))
const Providers = lazy(() => import('./IndexerProvidersSection.vue'))
const Subtitles = lazy(() => import('./IndexerSubtitlesSection.vue'))
const ThemeSongs = lazy(() => import('./ThemeSongsSection.vue'))
const Notifications = lazy(() => import('./NotificationsPanel.vue'))
const EmailSettings = lazy(() => import('./EmailSettingsSection.vue'))
const Devices = lazy(() => import('./DevicesPanel.vue'))
const General = lazy(() => import('./GeneralPanel.vue'))
const Users = lazy(() => import('./UsersPanel.vue'))
const Networking = lazy(() => import('./NetworkingSection.vue'))
const Connections = lazy(() => import('./ConnectionsSection.vue'))
const Updates = lazy(() => import('./UpdatesPanel.vue'))
const Backups = lazy(() => import('./BackupsPanel.vue'))
const Plugins = lazy(() => import('./PluginsPanel.vue'))

export interface PageBlock {
  component: Component
  props?: Record<string, unknown>
}

/** What each page shows, top to bottom. */
export const ADMIN_PAGE_BLOCKS: Record<StaticAdminPageId, PageBlock[]> = {
  overview: [{ component: Dashboard }],
  libraries: [{ component: Libraries }],
  tasks: [{ component: IndexerQueues }, { component: IndexerTasks }, { component: Tasks }],
  media: [{ component: Media }],
  transcoding: [{ component: Transcoding }],
  metadata: [{ component: Providers }],
  subtitles: [{ component: Subtitles }],
  themes: [{ component: ThemeSongs }],
  notifications: [{ component: Notifications }],
  smtp: [{ component: EmailSettings }],
  apikeys: [{ component: Devices, props: { part: 'keys' } }],
  server: [{ component: General }],
  users: [{ component: Users }, { component: Devices, props: { part: 'devices' } }],
  networking: [{ component: Networking }, { component: Connections }],
  updates: [{ component: Updates }],
  backups: [{ component: Backups }],
  plugins: [{ component: Plugins }],
}
