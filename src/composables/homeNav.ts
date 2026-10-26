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
    ...(enabled.value
      ? [
          { label: i18n.global.t('requests.nav.discover'), to: '/discover' },
          { label: i18n.global.t('requests.nav.requests'), to: '/requests' },
        ]
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
    { label: i18n.global.t('home.nav.home'), to: '/', icon: 'M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1V11z' },
    { label: i18n.global.t('home.nav.movies'), to: '/movies', icon: 'M4 5h16v14H4zM4 9h16M8 5l-2 4m6-4l-2 4m6-4l-2 4' },
    { label: i18n.global.t('home.nav.tv'), to: '/tv', icon: 'M3 6h18v12H3zM8 21h8' },
    { label: i18n.global.t('home.nav.music'), to: '/music', icon: 'M9 18V5l11-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zm11-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0z' },
    { label: i18n.global.t('home.nav.search'), to: '/search', icon: 'M21 21l-4.3-4.3M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0z' },
    ...(enabled.value
      ? [
          { label: i18n.global.t('requests.nav.discover'), to: '/discover', icon: 'M12 2l2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5z' },
          { label: i18n.global.t('requests.nav.requests'), to: '/requests', icon: 'M4 4h16v16H4zM8 8h8M8 12h8M8 16h5' },
        ]
      : []),
    ...plugins.mainPages.value.map((page) => ({ label: page.title, to: pagePath(page), icon: PLUGIN_PAGE_ICON })),
  ]
}

/** Home matches only itself; sections also match their sub-paths. */
export function isActivePath(current: string, target: string): boolean {
  return target === '/' ? current === '/' : current === target || current.startsWith(`${target}/`)
}
