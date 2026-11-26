import { ADMIN_TAB_IDS, pagesOf, type AdminPageId, type AdminTabId } from './adminNav'
import { ADMIN_PAGE_ICONS, ADMIN_TAB_ICONS } from './adminIcons'
import { WIDGET_CATALOG } from './dashboard/dashboardCatalog'

export type AdminCommandKind =
  | 'page'
  | 'widget'
  | 'section'
  | 'setting'
  | 'action'
  | 'route'
  | 'library'
  | 'user'
  | 'plugin'
  | 'task'
  | 'oauth'
  | 'apikey'
  | 'invite'
  | 'share'

export type AdminCommandFilter = 'all' | 'pages' | 'sections' | 'widgets' | 'settings' | 'live'

export interface AdminCommandItem {
  id: string
  kind: AdminCommandKind
  title: string
  subtitle?: string
  category: string
  icon: string
  keywords: string[]
  tab?: AdminTabId
  page?: AdminPageId
  pluginId?: string
  routeName?: string
  domId?: string
  scrollText?: string
  badge?: string
  run?: () => void | Promise<void>
}

interface StaticSectionEntry {
  id: string
  kind: 'section' | 'setting'
  tab: AdminTabId
  page: AdminPageId
  titleKey: string
  subtitleKey?: string
  keywords: string[]
  icon?: string
}

const STATIC_SECTIONS: StaticSectionEntry[] = [
  // Guide
  { id: 'section:guide:sources', kind: 'section', tab: 'guide', page: 'guide', titleKey: 'admin.guide.sourcesTitle', keywords: ['epg', 'iptv', 'xmltv', 'm3u', 'channels', 'live tv'] },
  { id: 'section:guide:channels', kind: 'section', tab: 'guide', page: 'guide', titleKey: 'admin.guide.channelsTitle', keywords: ['live tv', 'channel', 'lineup', 'sort'] },

  // Library -> Libraries
  { id: 'section:libraries:main', kind: 'section', tab: 'library', page: 'libraries', titleKey: 'admin.libraries.title', subtitleKey: 'admin.libraries.description', keywords: ['folders', 'scan', 'movies', 'shows', 'music', 'paths'] },

  // Library -> Tasks
  { id: 'section:tasks:queues', kind: 'section', tab: 'library', page: 'tasks', titleKey: 'admin.indexer.queuesTitle', keywords: ['indexer', 'workers', 'concurrency', 'pause', 'failed', 'pending'] },
  { id: 'section:tasks:indexer', kind: 'section', tab: 'library', page: 'tasks', titleKey: 'admin.indexer.tasksTitle', keywords: ['indexer', 'jobs', 'queue'] },
  { id: 'section:tasks:scheduled', kind: 'section', tab: 'library', page: 'tasks', titleKey: 'admin.tasks.title', subtitleKey: 'admin.tasks.description', keywords: ['cron', 'schedule', 'recurring', 'background'] },
  { id: 'setting:tasks:enabled', kind: 'setting', tab: 'library', page: 'tasks', titleKey: 'admin.tasks.enabled', keywords: ['cron', 'scheduler', 'toggle'] },

  // Library -> Media
  { id: 'section:media:main', kind: 'section', tab: 'library', page: 'media', titleKey: 'admin.media.title', subtitleKey: 'admin.media.description', keywords: ['movies', 'tv', 'episodes', 'music', 'metadata', 'identify', 'posters'] },

  // Library -> Transcoding
  { id: 'section:transcoding:main', kind: 'section', tab: 'library', page: 'transcoding', titleKey: 'admin.transcoding.title', subtitleKey: 'admin.transcoding.description', keywords: ['ffmpeg', 'hwaccel', 'vaapi', 'nvenc', 'qsv', 'hls', 'bitrate'] },

  // Advertising
  { id: 'section:ads:settings', kind: 'section', tab: 'advertising', page: 'advertisements', titleKey: 'advertisements.title', keywords: ['ads', 'preroll', 'midroll', 'vast', 'commercials'] },
  { id: 'setting:ads:enabled', kind: 'setting', tab: 'advertising', page: 'advertisements', titleKey: 'advertisements.enabled', keywords: ['ads', 'monetization', 'toggle'] },
  { id: 'section:ads:catalog', kind: 'section', tab: 'advertising', page: 'advertisements', titleKey: 'advertisements.catalog', keywords: ['ads', 'upload', 'video', 'campaigns'] },

  // Analytics
  { id: 'section:analytics:overview', kind: 'section', tab: 'analytics', page: 'analyticsOverview', titleKey: 'analytics.overview.title', subtitleKey: 'analytics.overview.description', keywords: ['charts', 'metrics', 'usage', 'stats'] },
  { id: 'section:analytics:video', kind: 'section', tab: 'analytics', page: 'analyticsVideo', titleKey: 'analytics.video.title', subtitleKey: 'analytics.video.description', keywords: ['movies', 'tv', 'plays', 'watch time'] },
  { id: 'section:analytics:music', kind: 'section', tab: 'analytics', page: 'analyticsMusic', titleKey: 'analytics.music.title', subtitleKey: 'analytics.music.description', keywords: ['tracks', 'albums', 'artists', 'listening'] },
  { id: 'section:analytics:history', kind: 'section', tab: 'analytics', page: 'analyticsHistory', titleKey: 'admin.activity.title', keywords: ['watch history', 'streams', 'playback', 'users'] },
  { id: 'section:analytics:ads', kind: 'section', tab: 'analytics', page: 'analyticsAdvertising', titleKey: 'analytics.advertising.title', subtitleKey: 'analytics.advertising.description', keywords: ['impressions', 'clicks', 'ads'] },
  { id: 'section:analytics:guide', kind: 'section', tab: 'analytics', page: 'analyticsGuide', titleKey: 'analytics.viewing.guide', keywords: ['live tv', 'channels', 'epg'] },
  { id: 'section:analytics:payments', kind: 'section', tab: 'analytics', page: 'analyticsPayments', titleKey: 'analytics.payments.title', subtitleKey: 'analytics.payments.description', keywords: ['revenue', 'orders', 'subscriptions', 'sales'] },

  // Logging
  { id: 'section:logging:config', kind: 'section', tab: 'logging', page: 'logging', titleKey: 'admin.logging.configuration', keywords: ['logger', 'endpoint', 'level'] },
  { id: 'section:logging:pairing', kind: 'section', tab: 'logging', page: 'logging', titleKey: 'admin.logging.pairingTitle', keywords: ['pair', 'token', 'remote logger'] },
  { id: 'section:logging:health', kind: 'section', tab: 'logging', page: 'logging', titleKey: 'admin.logging.health', keywords: ['status', 'uptime', 'disk'] },
  { id: 'section:logging:retention', kind: 'section', tab: 'logging', page: 'logging', titleKey: 'admin.logging.retention', keywords: ['days', 'prune', 'cleanup'] },
  { id: 'section:logging:quota', kind: 'section', tab: 'logging', page: 'logging', titleKey: 'admin.logging.quotaTitle', keywords: ['storage', 'limit', 'size'] },
  { id: 'section:logging:owner', kind: 'section', tab: 'logging', page: 'logging', titleKey: 'admin.logging.ownerTitle', keywords: ['owner', 'permissions'] },
  { id: 'section:logging:credentials', kind: 'section', tab: 'logging', page: 'logging', titleKey: 'admin.logging.credentialsTitle', keywords: ['keys', 'auth', 'ingest'] },
  { id: 'section:logging:rate', kind: 'section', tab: 'logging', page: 'logging', titleKey: 'admin.logging.rateTitle', keywords: ['rate limit', 'throttle'] },
  { id: 'section:logging:analytics', kind: 'section', tab: 'logging', page: 'logging', titleKey: 'admin.logging.analytics', keywords: ['volume', 'errors', 'chart'] },
  { id: 'section:logging:topSources', kind: 'section', tab: 'logging', page: 'logging', titleKey: 'admin.logging.topSources', keywords: ['sources', 'services'] },
  { id: 'section:logging:appCounts', kind: 'section', tab: 'logging', page: 'logging', titleKey: 'admin.logging.applicationCounts', keywords: ['apps', 'clients'] },
  { id: 'section:logging:errorGroups', kind: 'section', tab: 'logging', page: 'logging', titleKey: 'admin.logging.errorGroups', keywords: ['exceptions', 'stack', 'errors'] },
  { id: 'section:logging:history', kind: 'section', tab: 'logging', page: 'logging', titleKey: 'admin.logging.history', keywords: ['search', 'filter', 'logs'] },
  { id: 'section:logging:correlation', kind: 'section', tab: 'logging', page: 'logging', titleKey: 'admin.logging.correlationTitle', keywords: ['trace', 'request id', 'correlation'] },
  { id: 'section:logging:live', kind: 'section', tab: 'logging', page: 'logging', titleKey: 'admin.logging.liveTitle', keywords: ['stream', 'tail', 'realtime'] },

  // Providers
  { id: 'section:providers:metadata', kind: 'section', tab: 'providers', page: 'metadata', titleKey: 'admin.indexer.providersTitle', keywords: ['tmdb', 'tvdb', 'musicbrainz', 'imdb', 'scrapers'] },
  { id: 'section:providers:subtitles', kind: 'section', tab: 'providers', page: 'subtitles', titleKey: 'admin.indexer.subtitles.title', keywords: ['opensubtitles', 'srt', 'vtt', 'captions', 'languages'] },
  { id: 'section:providers:themes', kind: 'section', tab: 'providers', page: 'themes', titleKey: 'admin.themes.title', subtitleKey: 'admin.themes.description', keywords: ['theme songs', 'audio', 'tv themes'] },
  { id: 'setting:providers:themesEnabled', kind: 'setting', tab: 'providers', page: 'themes', titleKey: 'admin.themes.enabled', keywords: ['theme songs', 'toggle'] },
  { id: 'section:providers:trailers', kind: 'section', tab: 'providers', page: 'trailerCache', titleKey: 'admin.trailers.title', subtitleKey: 'admin.trailers.description', keywords: ['trailers', 'youtube', 'cache', 'previews'] },
  { id: 'setting:providers:trailersCache', kind: 'setting', tab: 'providers', page: 'trailerCache', titleKey: 'admin.trailers.cache', keywords: ['trailers', 'cache', 'toggle'] },

  // Requests
  { id: 'section:requests:general', kind: 'section', tab: 'requests', page: 'requests', titleKey: 'admin.requests.generalTitle', keywords: ['overseerr', 'jellyseerr', 'radarr', 'sonarr', 'lidarr'] },
  { id: 'setting:requests:enabled', kind: 'setting', tab: 'requests', page: 'requests', titleKey: 'admin.requests.enabled', keywords: ['requests', 'toggle'] },
  { id: 'setting:requests:autoApprove', kind: 'setting', tab: 'requests', page: 'requests', titleKey: 'admin.requests.autoApprove', keywords: ['requests', 'approval', 'auto'] },
  { id: 'section:requests:services', kind: 'section', tab: 'requests', page: 'requests', titleKey: 'admin.requests.servicesTitle', keywords: ['radarr', 'sonarr', 'lidarr', 'downloaders'] },
  { id: 'section:requests:users', kind: 'section', tab: 'requests', page: 'requests', titleKey: 'admin.requests.usersTitle', keywords: ['quotas', 'permissions', 'users'] },

  // Invites
  { id: 'section:invites:main', kind: 'section', tab: 'users', page: 'invites', titleKey: 'admin.invites.title', keywords: ['codes', 'sign up', 'onboarding', 'links'] },
  { id: 'section:invites:servers', kind: 'section', tab: 'users', page: 'invites', titleKey: 'admin.invites.servers.title', keywords: ['external', 'servers', 'federation'] },

  // Issues
  { id: 'section:issues:tickets', kind: 'section', tab: 'issues', page: 'tickets', titleKey: 'issues.adminTitle', subtitleKey: 'issues.adminDescription', keywords: ['tickets', 'bugs', 'support', 'reports'] },
  { id: 'section:issues:settings', kind: 'section', tab: 'issues', page: 'issueReports', titleKey: 'issues.settingsTitle', subtitleKey: 'issues.settingsDescription', keywords: ['reports', 'chat', 'support'] },
  { id: 'setting:issues:enableReports', kind: 'setting', tab: 'issues', page: 'issueReports', titleKey: 'issues.enableReports', keywords: ['issue reports', 'toggle'] },
  { id: 'setting:issues:enableChat', kind: 'setting', tab: 'issues', page: 'issueReports', titleKey: 'issues.enableChat', keywords: ['issue chat', 'toggle'] },

  // Notifications & SMTP
  { id: 'section:notifications:settings', kind: 'section', tab: 'notifications', page: 'notifications', titleKey: 'admin.notifications.settings.title', keywords: ['push', 'web push', 'vapid', 'alerts'] },
  { id: 'setting:notifications:enabled', kind: 'setting', tab: 'notifications', page: 'notifications', titleKey: 'admin.notifications.settings.enabled', keywords: ['notifications', 'push', 'toggle'] },
  { id: 'setting:notifications:newMedia', kind: 'setting', tab: 'notifications', page: 'notifications', titleKey: 'admin.notifications.settings.newMedia', keywords: ['new media', 'alerts', 'toggle'] },
  { id: 'section:notifications:list', kind: 'section', tab: 'notifications', page: 'notifications', titleKey: 'admin.notifications.title', keywords: ['broadcast', 'send notification'] },
  { id: 'section:smtp:main', kind: 'section', tab: 'notifications', page: 'smtp', titleKey: 'admin.general.emailTitle', subtitleKey: 'admin.general.emailDescription', keywords: ['smtp', 'email', 'mail server', 'host', 'port'] },
  { id: 'setting:smtp:secure', kind: 'setting', tab: 'notifications', page: 'smtp', titleKey: 'admin.general.smtpSecure', keywords: ['tls', 'ssl', 'smtp'] },

  // Mail
  { id: 'section:mail:settings', kind: 'section', tab: 'mail', page: 'mailOverview', titleKey: 'admin.mail.settingsTitle', keywords: ['inbound', 'outbound', 'relay', 'mx'] },
  { id: 'setting:mail:inbound', kind: 'setting', tab: 'mail', page: 'mailOverview', titleKey: 'admin.mail.inboundEnabled', keywords: ['mail', 'receive', 'toggle'] },
  { id: 'setting:mail:outbound', kind: 'setting', tab: 'mail', page: 'mailOverview', titleKey: 'admin.mail.outboundEnabled', keywords: ['mail', 'send', 'toggle'] },
  { id: 'section:mail:domains', kind: 'section', tab: 'mail', page: 'mailDomains', titleKey: 'admin.mail.addDomain', keywords: ['dkim', 'spf', 'dmarc', 'dns', 'domain'] },
  { id: 'section:mail:createInbox', kind: 'section', tab: 'mail', page: 'mailInboxes', titleKey: 'admin.mail.createInbox', keywords: ['mailbox', 'address', 'alias'] },
  { id: 'section:mail:inboxes', kind: 'section', tab: 'mail', page: 'mailInboxes', titleKey: 'admin.mail.inboxesTitle', keywords: ['mailboxes', 'addresses'] },
  { id: 'section:mail:templates', kind: 'section', tab: 'mail', page: 'mailTemplates', titleKey: 'admin.mail.templatesTitle', keywords: ['html', 'email templates', 'welcome', 'verify'] },

  // Payments
  { id: 'section:payments:general', kind: 'section', tab: 'payments', page: 'payments', titleKey: 'payments.admin.general', keywords: ['billing', 'stripe', 'currency', 'checkout'] },
  { id: 'setting:payments:enable', kind: 'setting', tab: 'payments', page: 'payments', titleKey: 'payments.admin.enable', keywords: ['payments', 'billing', 'toggle'] },
  { id: 'section:payments:provider', kind: 'section', tab: 'payments', page: 'payments', titleKey: 'payments.admin.provider', keywords: ['stripe', 'webhook', 'api key'] },
  { id: 'section:payments:registration', kind: 'section', tab: 'payments', page: 'payments', titleKey: 'payments.admin.registration', keywords: ['paid signup', 'paywall'] },
  { id: 'section:payments:tax', kind: 'section', tab: 'payments', page: 'payments', titleKey: 'payments.admin.tax', keywords: ['vat', 'tax', 'stripe tax'] },
  { id: 'section:payments:stats', kind: 'section', tab: 'payments', page: 'payments', titleKey: 'payments.admin.stats', keywords: ['revenue', 'mrr', 'totals'] },
  { id: 'section:payments:products', kind: 'section', tab: 'payments', page: 'paymentsCatalog', titleKey: 'payments.admin.products', keywords: ['items', 'one-time', 'pricing'] },
  { id: 'section:payments:plans', kind: 'section', tab: 'payments', page: 'paymentsCatalog', titleKey: 'payments.admin.plans', keywords: ['subscriptions', 'tiers', 'monthly', 'yearly'] },
  { id: 'section:payments:coupons', kind: 'section', tab: 'payments', page: 'paymentsCatalog', titleKey: 'payments.admin.coupons', keywords: ['discounts', 'promo codes'] },
  { id: 'section:payments:orders', kind: 'section', tab: 'payments', page: 'paymentsSales', titleKey: 'payments.admin.orders', keywords: ['invoices', 'purchases', 'transactions'] },
  { id: 'section:payments:subscriptions', kind: 'section', tab: 'payments', page: 'paymentsSales', titleKey: 'payments.admin.subscriptions', keywords: ['recurring', 'active plans'] },
  { id: 'section:payments:grants', kind: 'section', tab: 'payments', page: 'paymentsSales', titleKey: 'payments.admin.grants', keywords: ['comp', 'free access', 'manual grant'] },

  // API Keys & OAuth
  { id: 'section:apikeys:main', kind: 'section', tab: 'users', page: 'apikeys', titleKey: 'admin.devices.apiKeysTitle', subtitleKey: 'admin.devices.apiKeysDescription', keywords: ['tokens', 'bearer', 'integrations', 'scripts'] },
  { id: 'section:oauth:main', kind: 'section', tab: 'users', page: 'oauth', titleKey: 'oidc.admin.title', keywords: ['oidc', 'sso', 'client id', 'redirect uri', 'openid'] },

  // Video Player & DRM
  { id: 'section:player:settings', kind: 'section', tab: 'videoPlayer', page: 'playerSettings', titleKey: 'admin.playerSettings.title', subtitleKey: 'admin.playerSettings.description', keywords: ['shaka', 'hls', 'dash', 'playback', 'buffering'] },
  { id: 'section:drm:widevine', kind: 'section', tab: 'videoPlayer', page: 'widevine', titleKey: 'admin.drm.widevine.title', subtitleKey: 'admin.drm.widevine.description', keywords: ['drm', 'widevine', 'license', 'encryption'] },
  { id: 'setting:drm:widevineEnable', kind: 'setting', tab: 'videoPlayer', page: 'widevine', titleKey: 'admin.drm.widevine.enable', keywords: ['drm', 'widevine', 'toggle'] },
  { id: 'section:drm:testing', kind: 'section', tab: 'videoPlayer', page: 'widevine', titleKey: 'admin.drm.testing.title', keywords: ['drm', 'test', 'playback', 'diagnostics'] },

  // Communications
  { id: 'section:comms:chat', kind: 'section', tab: 'communications', page: 'chatSettings', titleKey: 'admin.communications.chatEncryption.title', keywords: ['mls', 'e2ee', 'encryption', 'chat'] },
  { id: 'setting:comms:chatEnable', kind: 'setting', tab: 'communications', page: 'chatSettings', titleKey: 'admin.communications.chatEncryption.enable', keywords: ['chat encryption', 'mls', 'toggle'] },
  { id: 'section:comms:calls', kind: 'section', tab: 'communications', page: 'callSettings', titleKey: 'admin.communications.calls.title', keywords: ['webrtc', 'turn', 'stun', 'voice', 'video call'] },
  { id: 'setting:comms:callsEnable', kind: 'setting', tab: 'communications', page: 'callSettings', titleKey: 'admin.communications.calls.enable', keywords: ['calls', 'webrtc', 'toggle'] },

  // Plugins
  { id: 'section:plugins:installed', kind: 'section', tab: 'plugins', page: 'plugins', titleKey: 'admin.plugins.installed', keywords: ['extensions', 'addons', 'enable', 'disable'] },
  { id: 'section:plugins:local', kind: 'section', tab: 'plugins', page: 'plugins', titleKey: 'admin.plugins.localImport', keywords: ['upload', 'zip', 'tar', 'sideload'] },
  { id: 'section:plugins:repos', kind: 'section', tab: 'plugins', page: 'plugins', titleKey: 'admin.plugins.repositories', keywords: ['sources', 'catalog', 'urls'] },
  { id: 'section:plugins:discover', kind: 'section', tab: 'plugins', page: 'plugins', titleKey: 'admin.plugins.discover', keywords: ['marketplace', 'browse', 'install'] },

  // Settings -> Server
  { id: 'section:server:general', kind: 'section', tab: 'settings', page: 'server', titleKey: 'admin.general.title', subtitleKey: 'admin.general.description', keywords: ['server name', 'url', 'language', 'branding'] },
  { id: 'section:server:notifications', kind: 'section', tab: 'settings', page: 'server', titleKey: 'admin.general.notificationsTitle', subtitleKey: 'admin.general.notificationsDescription', keywords: ['admin alerts', 'approval', 'task fail'] },
  { id: 'setting:server:notifyNewUser', kind: 'setting', tab: 'settings', page: 'server', titleKey: 'admin.general.newUserAwaitingApproval', keywords: ['user approval', 'notification'] },
  { id: 'setting:server:notifyTaskFail', kind: 'setting', tab: 'settings', page: 'server', titleKey: 'admin.general.scheduledTaskFailed', keywords: ['task failure', 'notification'] },
  { id: 'section:server:monitoring', kind: 'section', tab: 'settings', page: 'server', titleKey: 'admin.monitoring.title', keywords: ['sentry', 'error monitoring', 'telemetry'] },
  { id: 'setting:server:monitoringGlobal', kind: 'setting', tab: 'settings', page: 'server', titleKey: 'admin.monitoring.global', keywords: ['sentry', 'errors', 'toggle'] },
  { id: 'section:server:requestLogging', kind: 'section', tab: 'settings', page: 'server', titleKey: 'admin.requestLogging.title', keywords: ['http', 'audit', 'access logs'] },
  { id: 'section:server:dangerZone', kind: 'section', tab: 'settings', page: 'server', titleKey: 'admin.general.dangerZoneTitle', subtitleKey: 'admin.general.dangerZoneDescription', keywords: ['clear cache', 'reset', 'danger'] },
  { id: 'setting:server:clearCache', kind: 'setting', tab: 'settings', page: 'server', titleKey: 'admin.general.clearMetadataCache', keywords: ['cache', 'clear', 'metadata'] },
  { id: 'setting:server:resetHistory', kind: 'setting', tab: 'settings', page: 'server', titleKey: 'admin.general.resetPlaybackHistory', keywords: ['reset', 'history', 'playback'] },

  // Settings -> Appearance
  { id: 'section:appearance:main', kind: 'section', tab: 'settings', page: 'appearance', titleKey: 'admin.appearance.title', subtitleKey: 'admin.appearance.description', keywords: ['themes', 'colors', 'css', 'branding', 'accent'] },
  { id: 'setting:appearance:allowUsers', kind: 'setting', tab: 'settings', page: 'appearance', titleKey: 'admin.appearance.allowUsers', keywords: ['user themes', 'customization'] },
  { id: 'section:appearance:loginLayout', kind: 'section', tab: 'settings', page: 'appearance', titleKey: 'admin.appearance.loginLayout.title', keywords: ['login page', 'background', 'layout'] },
  { id: 'section:appearance:userChoice', kind: 'section', tab: 'settings', page: 'appearance', titleKey: 'admin.appearance.userChoiceTitle', keywords: ['theme picker', 'default theme'] },

  // Settings -> Webhooks
  { id: 'section:webhooks:main', kind: 'section', tab: 'settings', page: 'webhooks', titleKey: 'webhooks.adminTitle', subtitleKey: 'webhooks.adminDescription', keywords: ['events', 'http', 'callbacks', 'discord', 'slack'] },
  { id: 'setting:webhooks:enable', kind: 'setting', tab: 'settings', page: 'webhooks', titleKey: 'webhooks.enable', keywords: ['webhooks', 'toggle'] },

  // Settings -> AI
  { id: 'section:ai:main', kind: 'section', tab: 'settings', page: 'ai', titleKey: 'admin.ai.title', keywords: ['recommendations', 'embeddings', 'llm', 'machine learning'] },
  { id: 'setting:ai:enabled', kind: 'setting', tab: 'settings', page: 'ai', titleKey: 'admin.ai.enabled', keywords: ['ai', 'toggle'] },
  { id: 'section:ai:service', kind: 'section', tab: 'settings', page: 'ai', titleKey: 'admin.ai.serviceTitle', keywords: ['ai service', 'model', 'endpoint'] },
  { id: 'section:ai:recs', kind: 'section', tab: 'settings', page: 'ai', titleKey: 'admin.ai.userRecommendationsTitle', keywords: ['cache', 'refresh', 'recommendations'] },
  { id: 'section:ai:activity', kind: 'section', tab: 'settings', page: 'ai', titleKey: 'admin.ai.activityTitle', keywords: ['ai logs', 'jobs'] },

  // Settings -> Users
  { id: 'section:users:main', kind: 'section', tab: 'users', page: 'users', titleKey: 'admin.users.title', subtitleKey: 'admin.users.description', keywords: ['accounts', 'roles', 'passwords', 'create user', 'ban'] },
  { id: 'section:users:signUpPolicy', kind: 'section', tab: 'users', page: 'users', titleKey: 'admin.users.signUpPolicy', keywords: ['registration', 'public', 'email verification'] },
  { id: 'setting:users:publicReg', kind: 'setting', tab: 'users', page: 'users', titleKey: 'admin.users.allowPublicRegistration', keywords: ['signup', 'registration', 'toggle'] },
  { id: 'setting:users:emailVerify', kind: 'setting', tab: 'users', page: 'users', titleKey: 'admin.users.requireEmailVerification', keywords: ['email', 'verify', 'toggle'] },
  { id: 'section:users:quickConnect', kind: 'section', tab: 'users', page: 'users', titleKey: 'admin.users.quickConnectTitle', keywords: ['tv', 'pin', 'code', 'pairing'] },
  { id: 'setting:users:quickConnectEnable', kind: 'setting', tab: 'users', page: 'users', titleKey: 'admin.users.quickConnectEnable', keywords: ['quick connect', 'toggle'] },
  { id: 'section:users:access', kind: 'section', tab: 'users', page: 'users', titleKey: 'admin.access.displayTitle', keywords: ['ratings', 'parental', 'restrictions'] },
  { id: 'section:users:devices', kind: 'section', tab: 'users', page: 'users', titleKey: 'admin.devices.title', subtitleKey: 'admin.devices.description', keywords: ['sessions', 'tokens', 'browsers', 'apps', 'sign out'] },

  // Settings -> Networking
  { id: 'section:networking:main', kind: 'section', tab: 'settings', page: 'networking', titleKey: 'admin.general.networkingTitle', subtitleKey: 'admin.general.networkingDescription', keywords: ['reverse proxy', 'cors', 'ports', 'ssl', 'smb', 'nfs'] },
  { id: 'setting:networking:trustProxies', kind: 'setting', tab: 'settings', page: 'networking', titleKey: 'admin.loginSecurity.trustProxies', keywords: ['x-forwarded-for', 'nginx', 'cloudflare', 'proxy'] },
  { id: 'section:networking:connections', kind: 'section', tab: 'settings', page: 'networking', titleKey: 'admin.connections.title', keywords: ['external', 'services', 'integrations'] },

  // Settings -> Search
  { id: 'section:search:main', kind: 'section', tab: 'library', page: 'search', titleKey: 'admin.search.title', subtitleKey: 'admin.search.description', keywords: ['meilisearch', 'index', 'rebuild', 'full text'] },
  { id: 'setting:search:enabled', kind: 'setting', tab: 'library', page: 'search', titleKey: 'admin.search.enabled', keywords: ['search', 'meilisearch', 'toggle'] },

  // Settings -> Updates
  { id: 'section:updates:main', kind: 'section', tab: 'settings', page: 'updates', titleKey: 'admin.updates.title', subtitleKey: 'admin.updates.description', keywords: ['version', 'upgrade', 'release', 'docker'] },
  { id: 'section:updates:settings', kind: 'section', tab: 'settings', page: 'updates', titleKey: 'admin.updates.settings.title', keywords: ['auto update', 'maintenance mode'] },
  { id: 'setting:updates:auto', kind: 'setting', tab: 'settings', page: 'updates', titleKey: 'admin.updates.settings.auto', keywords: ['auto update', 'toggle'] },
  { id: 'setting:updates:maintenance', kind: 'setting', tab: 'settings', page: 'updates', titleKey: 'admin.updates.settings.maintenance', keywords: ['maintenance mode', 'offline', 'toggle'] },
  { id: 'section:updates:backups', kind: 'section', tab: 'settings', page: 'updates', titleKey: 'admin.updates.backups.title', subtitleKey: 'admin.updates.backups.help', keywords: ['snapshot', 'rollback'] },

  // Settings -> Backups
  { id: 'section:backups:main', kind: 'section', tab: 'settings', page: 'backups', titleKey: 'admin.backups.title', subtitleKey: 'admin.backups.description', keywords: ['export', 'download', 'database', 'archive'] },
  { id: 'section:backups:restore', kind: 'section', tab: 'settings', page: 'backups', titleKey: 'admin.backups.restoreTitle', keywords: ['import', 'upload', 'recover'] },
  { id: 'section:backups:schedule', kind: 'section', tab: 'settings', page: 'backups', titleKey: 'admin.backups.schedule.title', keywords: ['cron', 'automatic', 'retention'] },
  { id: 'section:backups:encryption', kind: 'section', tab: 'settings', page: 'backups', titleKey: 'admin.backups.encryption.title', keywords: ['password', 'encrypt', 'aes'] },
]

export interface BuildStaticIndexOptions {
  t: (key: string) => string
  openPageBuilder?: () => void
  openActivityView?: () => void
}

export function buildStaticAdminCommands({ t, openPageBuilder, openActivityView }: BuildStaticIndexOptions): AdminCommandItem[] {
  const items: AdminCommandItem[] = []

  // 1. All Admin Pages
  for (const tab of ADMIN_TAB_IDS) {
    const groupLabel = t(`admin.groups.${tab}`)
    const tabIcon = ADMIN_TAB_ICONS[tab]
    for (const page of pagesOf(tab)) {
      const pageLabel = t(`admin.pages.${page}`)
      const subtitle = t(`admin.subtitles.${page}`)
      items.push({
        id: `page:${tab}:${page}`,
        kind: 'page',
        title: pageLabel === groupLabel ? pageLabel : `${groupLabel} — ${pageLabel}`,
        subtitle,
        category: groupLabel,
        icon: ADMIN_PAGE_ICONS[page] ?? tabIcon,
        keywords: [tab, page, groupLabel, pageLabel, subtitle],
        tab,
        page,
      })
    }
  }

  // 2. Extra Admin Routes
  items.push({
    id: 'route:admin-activity',
    kind: 'route',
    title: t('admin.activity.title'),
    subtitle: t('admin.activity.subtitle'),
    category: t('admin.groups.dashboard'),
    icon: 'lucide:history',
    keywords: ['activity', 'watch history', 'streams', 'full log', 'admin activity'],
    routeName: 'admin-activity',
    run: openActivityView,
  })

  items.push({
    id: 'route:page-builder',
    kind: 'route',
    title: t('admin.commandPalette.pageBuilderTitle'),
    subtitle: t('admin.commandPalette.pageBuilderSubtitle'),
    category: t('admin.groups.settings'),
    icon: 'lucide:blocks',
    keywords: ['page builder', 'custom pages', 'home layout', 'editor', 'blocks'],
    routeName: 'page-builder',
    run: openPageBuilder,
  })

  // 3. All Dashboard Widgets
  for (const widget of WIDGET_CATALOG) {
    const name = t(`admin.dashboard.widgets.${widget.id}`)
    const description = t(`admin.dashboard.descriptions.${widget.id}`)
    const categoryName = t(`admin.dashboard.categoryNames.${widget.category}`)
    items.push({
      id: `widget:${widget.id}`,
      kind: 'widget',
      title: name,
      subtitle: description,
      category: `${t('admin.groups.dashboard')} › ${categoryName}`,
      icon: 'lucide:layout-grid',
      keywords: [widget.id, widget.category, name, description, categoryName, ...widget.keywords],
      tab: 'dashboard',
      page: 'overview',
      domId: `dashboard-widget-${widget.id}`,
    })
  }

  // 4. All Page Sections & Settings
  for (const entry of STATIC_SECTIONS) {
    const title = t(entry.titleKey)
    const groupLabel = t(`admin.groups.${entry.tab}`)
    const pageLabel = t(`admin.pages.${entry.page}`)
    const subtitle = entry.subtitleKey ? t(entry.subtitleKey) : `${groupLabel} › ${pageLabel}`
    items.push({
      id: entry.id,
      kind: entry.kind,
      title,
      subtitle,
      category: `${groupLabel} › ${pageLabel}`,
      icon: entry.icon ?? (entry.kind === 'setting' ? 'lucide:sliders-horizontal' : ADMIN_PAGE_ICONS[entry.page]),
      keywords: [entry.tab, entry.page, groupLabel, pageLabel, title, subtitle, ...entry.keywords],
      tab: entry.tab,
      page: entry.page,
      scrollText: title,
    })
  }

  return items
}

export function matchesCommandFilter(item: AdminCommandItem, filter: AdminCommandFilter): boolean {
  switch (filter) {
    case 'all':
      return true
    case 'pages':
      return item.kind === 'page' || item.kind === 'route'
    case 'widgets':
      return item.kind === 'widget'
    case 'sections':
      return item.kind === 'section'
    case 'settings':
      return item.kind === 'setting' || item.kind === 'action'
    case 'live':
      return (
        item.kind === 'library' ||
        item.kind === 'user' ||
        item.kind === 'plugin' ||
        item.kind === 'task' ||
        item.kind === 'oauth' ||
        item.kind === 'apikey' ||
        item.kind === 'invite' ||
        item.kind === 'share'
      )
  }
}

function scoreCommand(item: AdminCommandItem, words: string[], recentIds: readonly string[]): number {
  if (words.length === 0) {
    const recentIndex = recentIds.indexOf(item.id)
    if (recentIndex !== -1) return 10_000 - recentIndex * 10
    if (item.kind === 'page' || item.kind === 'route') return 500
    if (item.kind === 'widget') return 300
    if (item.kind === 'section') return 200
    return 100
  }

  const title = item.title.toLowerCase()
  const subtitle = (item.subtitle ?? '').toLowerCase()
  const category = item.category.toLowerCase()
  const keywords = item.keywords.join(' ').toLowerCase()
  const haystack = `${title} ${subtitle} ${category} ${keywords} ${item.id.toLowerCase()}`

  if (!words.every((word) => haystack.includes(word))) return -1

  let score = 0
  const joined = words.join(' ')

  if (title === joined) score += 1000
  else if (title.startsWith(joined)) score += 600
  else if (title.includes(joined)) score += 350

  for (const word of words) {
    if (title.startsWith(word)) score += 180
    else if (title.includes(word)) score += 120
    else if (category.includes(word)) score += 60
    else if (subtitle.includes(word)) score += 45
    else if (keywords.includes(word)) score += 30
  }

  if (item.kind === 'page' || item.kind === 'route') score += 40
  else if (item.kind === 'widget') score += 25
  else if (item.kind === 'section') score += 15

  const recentIndex = recentIds.indexOf(item.id)
  if (recentIndex !== -1) score += 50 - recentIndex * 5

  return score
}

const EMPTY_QUERY_LIMIT = 4

export function searchAdminCommands(
  items: readonly AdminCommandItem[],
  query: string,
  filter: AdminCommandFilter = 'all',
  recentIds: readonly string[] = [],
  limit = 60,
): AdminCommandItem[] {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
  const effectiveLimit = words.length === 0 && filter === 'all' ? Math.min(limit, EMPTY_QUERY_LIMIT) : limit
  const scored: { item: AdminCommandItem; score: number }[] = []

  for (const item of items) {
    if (!matchesCommandFilter(item, filter)) continue
    const score = scoreCommand(item, words, recentIds)
    if (score >= 0) scored.push({ item, score })
  }

  scored.sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title))
  return scored.slice(0, effectiveLimit).map((entry) => entry.item)
}
