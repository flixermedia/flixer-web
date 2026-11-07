import { defineAsyncComponent, type Component } from 'vue'
import type { AdminPageId } from './adminNav'

const lazy = (load: () => Promise<{ default: Component }>) => defineAsyncComponent(load)

const Dashboard = lazy(() => import('./DashboardPanel.vue'))
const Logging = lazy(() => import('./LoggingPanel.vue'))
const Guide = lazy(() => import('./GuidePanel.vue'))
const Libraries = lazy(() => import('./LibrariesPanel.vue'))
const IndexerQueues = lazy(() => import('./IndexerQueuesSection.vue'))
const IndexerTasks = lazy(() => import('./IndexerTasksSection.vue'))
const Tasks = lazy(() => import('./TasksPanel.vue'))
const Media = lazy(() => import('./MediaPanel.vue'))
const Transcoding = lazy(() => import('./TranscodingPanel.vue'))
const Advertisements = lazy(() => import('./AdvertisementsPanel.vue'))
const Analytics = lazy(() => import('./AnalyticsPanel.vue'))
const Activity = lazy(() => import('./ActivityPanel.vue'))
const ViewingAnalytics = lazy(() => import('./ViewingAnalyticsPanel.vue'))
const PeriodAnalytics = lazy(() => import('./PeriodAnalyticsPanel.vue'))
const Providers = lazy(() => import('./IndexerProvidersSection.vue'))
const Subtitles = lazy(() => import('./IndexerSubtitlesSection.vue'))
const ThemeSongs = lazy(() => import('./ThemeSongsSection.vue'))
const TrailerCache = lazy(() => import('./TrailerSettingsSection.vue'))
const Requests = lazy(() => import('./RequestsPanel.vue'))
const IssueReports = lazy(() => import('./IssueReportsPanel.vue'))
const IssueReportSettings = lazy(() => import('./IssueReportSettingsPanel.vue'))
const Notifications = lazy(() => import('./NotificationsPanel.vue'))
const EmailSettings = lazy(() => import('./EmailSettingsSection.vue'))
const MailAdmin = lazy(() => import('./MailAdminPanel.vue'))
const Devices = lazy(() => import('./DevicesPanel.vue'))
const General = lazy(() => import('./GeneralPanel.vue'))
const UserWebhooks = lazy(() => import('./UserWebhookSettings.vue'))
const Users = lazy(() => import('./UsersPanel.vue'))
const Networking = lazy(() => import('./NetworkingSection.vue'))
const Connections = lazy(() => import('./ConnectionsSection.vue'))
const Search = lazy(() => import('./MediaSearchSettingsSection.vue'))
const Updates = lazy(() => import('./UpdatesPanel.vue'))
const Backups = lazy(() => import('./BackupsPanel.vue'))
const Ai = lazy(() => import('./AiPanel.vue'))
const Plugins = lazy(() => import('./PluginsPanel.vue'))
const PaymentSettings = lazy(() => import('./payments/PaymentSettingsPanel.vue'))
const PaymentCatalog = lazy(() => import('./payments/PaymentCatalogPanel.vue'))
const PaymentOrders = lazy(() => import('./payments/PaymentOrdersPanel.vue'))
const PaymentSubscriptions = lazy(() => import('./payments/PaymentSubscriptionsPanel.vue'))
const PaymentGrants = lazy(() => import('./payments/PaymentGrantsPanel.vue'))

export interface PageBlock {
  component: Component
  props?: Record<string, unknown>
}

/** What each page shows, top to bottom. */
export const ADMIN_PAGE_BLOCKS: Record<AdminPageId, PageBlock[]> = {
  overview: [{ component: Dashboard }],
  logging: [{ component: Logging }],
  guide: [{ component: Guide }],
  libraries: [{ component: Libraries }],
  tasks: [{ component: IndexerQueues }, { component: IndexerTasks }, { component: Tasks }],
  media: [{ component: Media }],
  transcoding: [{ component: Transcoding }],
  advertisements: [{ component: Advertisements }],
  analyticsOverview: [{ component: Analytics, props: { screen: 'overview' } }],
  analyticsVideo: [{ component: ViewingAnalytics, props: { screen: 'video' } }, { component: Analytics, props: { screen: 'video' } }],
  analyticsMusic: [{ component: PeriodAnalytics, props: { screen: 'music' } }, { component: Analytics, props: { screen: 'music' } }],
  analyticsHistory: [{ component: ViewingAnalytics, props: { screen: 'history' } }, { component: Activity, props: { embedded: true } }],
  analyticsAdvertising: [{ component: Analytics, props: { screen: 'advertising' } }],
  analyticsGuide: [{ component: ViewingAnalytics, props: { screen: 'guide' } }],
  analyticsPayments: [{ component: PeriodAnalytics, props: { screen: 'orders' } }, { component: Analytics, props: { screen: 'payments' } }],
  metadata: [{ component: Providers }],
  subtitles: [{ component: Subtitles }],
  themes: [{ component: ThemeSongs }],
  trailerCache: [{ component: TrailerCache }],
  requests: [{ component: Requests }],
  tickets: [{ component: IssueReports }],
  notifications: [{ component: Notifications }],
  smtp: [{ component: EmailSettings }],
  mailOverview: [{ component: MailAdmin, props: { screen: 'overview' } }],
  mailDomains: [{ component: MailAdmin, props: { screen: 'domains' } }],
  mailInboxes: [{ component: MailAdmin, props: { screen: 'inboxes' } }],
  mailMessages: [{ component: MailAdmin, props: { screen: 'messages' } }],
  mailTemplates: [{ component: MailAdmin, props: { screen: 'templates' } }],
  apikeys: [{ component: Devices, props: { part: 'keys' } }],
  server: [{ component: General }],
  webhooks: [{ component: UserWebhooks }],
  ai: [{ component: Ai }],
  issueReports: [{ component: IssueReportSettings }],
  users: [{ component: Users }, { component: Devices, props: { part: 'devices' } }],
  networking: [{ component: Networking }, { component: Connections }],
  search: [{ component: Search }],
  updates: [{ component: Updates }],
  backups: [{ component: Backups }],
  plugins: [{ component: Plugins }],
  payments: [{ component: PaymentSettings }],
  paymentsCatalog: [{ component: PaymentCatalog }],
  paymentsSales: [{ component: PaymentOrders }, { component: PaymentSubscriptions }, { component: PaymentGrants }],
}
