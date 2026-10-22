import type { NavLink, NavTab } from '../types/media'
import { i18n } from '../i18n'

export function getNavLinks(): NavLink[] {
  return [
    { label: i18n.global.t('home.nav.home'), to: '/' },
    { label: i18n.global.t('home.nav.movies'), to: '/movies' },
    { label: i18n.global.t('home.nav.tvShows'), to: '/tv' },
    { label: i18n.global.t('home.nav.music'), to: '/music' },
  ]
}

export function getMobileTabs(): NavTab[] {
  return [
    { label: i18n.global.t('home.nav.home'), to: '/', icon: 'M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1V11z' },
    { label: i18n.global.t('home.nav.movies'), to: '/movies', icon: 'M4 5h16v14H4zM4 9h16M8 5l-2 4m6-4l-2 4m6-4l-2 4' },
    { label: i18n.global.t('home.nav.tv'), to: '/tv', icon: 'M3 6h18v12H3zM8 21h8' },
    { label: i18n.global.t('home.nav.music'), to: '/music', icon: 'M9 18V5l11-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zm11-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0z' },
    { label: i18n.global.t('home.nav.search'), to: '/search', icon: 'M21 21l-4.3-4.3M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0z' },
  ]
}

/** Home matches only itself; sections also match their sub-paths. */
export function isActivePath(current: string, target: string): boolean {
  return target === '/' ? current === '/' : current === target || current.startsWith(`${target}/`)
}
