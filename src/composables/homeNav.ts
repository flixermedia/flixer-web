import type { NavLink, NavTab } from '../types/media'
import { i18n } from '../i18n'
import { useRequestsConfig } from './useRequestsConfig'
import { pagePath, usePluginPages } from './usePluginPages'

const PLUGIN_PAGE_ICON = 'M4 4h16v16H4zM8 8h8M8 12h8M8 16h5'

export function getNavLinks(): NavLink[] {
  const { enabled, load } = useRequestsConfig()
  void load()
  const plugins = usePluginPages()
  void plugins.load()
  return [
    { label: i18n.global.t('home.nav.home'), to: '/' },
    { label: i18n.global.t('home.nav.movies'), to: '/movies' },
    { label: i18n.global.t('home.nav.tvShows'), to: '/tv' },
    { label: i18n.global.t('home.nav.music'), to: '/music' },
    { label: i18n.global.t('home.nav.guide'), to: '/guide' },
    ...(enabled.value
      ? [{ label: i18n.global.t('requests.nav.discover'), to: '/discover' }]
      : []),
    ...plugins.mainPages.value.map((page) => ({ label: page.title, to: pagePath(page) })),
  ]
}

export function getMobileTabs(): NavTab[] {
  const { enabled, load } = useRequestsConfig()
  void load()
  const plugins = usePluginPages()
  void plugins.load()
  return [
    { label: i18n.global.t('home.nav.home'), to: '/', icon: 'lucide:house' },
    { label: i18n.global.t('home.nav.movies'), to: '/movies', icon: 'lucide:film' },
    { label: i18n.global.t('home.nav.tv'), to: '/tv', icon: 'lucide:tv' },
    { label: i18n.global.t('home.nav.music'), to: '/music', icon: 'lucide:music-2' },
    { label: i18n.global.t('chat.title'), to: '/chat', icon: 'lucide:messages-square' },
    { label: i18n.global.t('home.nav.guide'), to: '/guide', icon: 'lucide:calendar-days' },
    { label: i18n.global.t('home.nav.search'), to: '/search', icon: 'lucide:search' },
    ...(enabled.value
      ? [{ label: i18n.global.t('requests.nav.discover'), to: '/discover', icon: 'lucide:sparkles' }]
      : []),
    ...plugins.mainPages.value.map((page) => ({ label: page.title, to: pagePath(page), icon: PLUGIN_PAGE_ICON })),
  ]
}

/** Home matches only itself; sections also match their sub-paths. */
export function isActivePath(current: string, target: string): boolean {
  return target === '/' ? current === '/' : current === target || current.startsWith(`${target}/`)
}
