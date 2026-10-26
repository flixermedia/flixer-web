import axios from 'axios'
import { createRouter, createWebHistory } from 'vue-router'
import { clearAccessToken, getAccessToken, validateAccessToken } from '../api'
import { useProfile } from '../composables/useProfile'
import { i18n } from '../i18n'
import { setupGuard } from '../setup/setupGate'

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    requiresAdmin?: boolean
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.hash) return { el: to.hash }
    // Same-page query changes (e.g. admin/settings tabs) keep their scroll position.
    if (to.path === from.path) return false
    return { top: 0, behavior: 'smooth' }
  },
  routes: [
    {
      path: '/setup',
      name: 'setup',
      component: () => import('../views/SetupView.vue'),
    },
    {
      path: '/unavailable',
      name: 'unavailable',
      component: () => import('../views/UnavailableView.vue'),
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../views/LoginView.vue'),
    },
    {
      path: '/verify-email',
      name: 'verify-email',
      component: () => import('../views/VerifyEmailView.vue'),
    },
    {
      path: '/',
      name: 'home',
      component: () => import('../views/HomeView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/discover',
      name: 'discover',
      component: () => import('../views/DiscoverView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/requests',
      name: 'requests',
      component: () => import('../views/RequestsView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/request/:type/:id',
      name: 'request-item',
      component: () => import('../views/RequestItemView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/plugins/:pluginId/:pageId',
      name: 'plugin-page',
      component: () => import('../views/PluginPageView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/media/:id',
      name: 'media-item',
      component: () => import('../views/MediaItemView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/person/:id',
      name: 'person',
      component: () => import('../views/PersonView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('../views/SettingsView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/admin',
      name: 'admin',
      component: () => import('../views/AdminView.vue'),
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/admin/activity',
      name: 'admin-activity',
      component: () => import('../views/AdminActivityView.vue'),
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/movies',
      name: 'movies',
      component: () => import('../views/BrowseView.vue'),
      props: { kind: 'movies' },
      meta: { requiresAuth: true },
    },
    {
      path: '/tv',
      name: 'tv',
      component: () => import('../views/BrowseView.vue'),
      props: { kind: 'tv' },
      meta: { requiresAuth: true },
    },
    {
      path: '/music',
      name: 'music',
      component: () => import('../views/BrowseView.vue'),
      props: { kind: 'music' },
      meta: { requiresAuth: true },
    },
    {
      path: '/search',
      name: 'search',
      component: () => import('../views/SearchView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/player-test',
      name: 'player-test',
      component: () => import('../views/PlayerTestView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/passkeys',
      redirect: { path: '/settings', query: { tab: 'passkeys' } },
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
})

router.beforeEach(async (to) => {
  const setupRedirect = await setupGuard(to)
  if (setupRedirect !== true) return setupRedirect

  const accessToken = getAccessToken()
  const isAuthRoute = to.name === 'login' || to.name === 'register'

  if (isAuthRoute && to.query.sessionCheck === 'unavailable') {
    return true
  }

  if (!to.meta.requiresAuth && !isAuthRoute) {
    return true
  }

  if (!accessToken) {
    return to.meta.requiresAuth ? { name: 'login', query: { redirect: to.fullPath } } : true
  }

  // Offline: trust the stored token so the cached app can still render.
  if (!navigator.onLine) {
    return true
  }

  try {
    const isValid = await validateAccessToken()
    if (!isValid) {
      clearAccessToken()
      return isAuthRoute ? true : { name: 'login', query: { redirect: to.fullPath } }
    }

    if (to.meta.requiresAdmin) {
      const { profile, load } = useProfile()
      await load()
      if (profile.value?.role !== 'admin') {
        return { name: 'home' }
      }
    }

    return isAuthRoute ? { name: 'home' } : true
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      clearAccessToken()
      return isAuthRoute ? true : { name: 'login', query: { redirect: to.fullPath } }
    }

    return {
      name: 'login',
      query: {
        ...to.query,
        redirect: to.query.redirect ?? to.fullPath,
        sessionCheck: 'unavailable',
      },
    }
  }
})

router.afterEach((to) => {
  document.title = to.name === 'setup' ? i18n.global.t('setup.title') : to.name === 'register' ? i18n.global.t('router.registerTitle') : to.name === 'login' ? i18n.global.t('router.loginTitle') : i18n.global.t('router.defaultTitle')
})

export default router
