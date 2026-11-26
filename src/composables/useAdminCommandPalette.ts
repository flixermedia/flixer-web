import { nextTick, ref } from 'vue'
import type { Router } from 'vue-router'
import { listAdminScheduledTasks, listAdminUsers, listApiKeys } from '../api/admin'
import { listInvitations } from '../api/invites'
import { listMediaLibraries, listNetworkShares } from '../api/media'
import { listOidcClients } from '../api/oidc'
import { listPluginInstallations } from '../api/plugins'
import { adminQuery } from '../components/admin/adminNav'
import type { AdminCommandItem } from '../components/admin/adminCommandIndex'

const RECENT_STORAGE_KEY = 'flixer.admin-command-recent'
const MAX_RECENT_ITEMS = 8
const LIVE_CACHE_TTL_MS = 30_000

const isOpen = ref(false)
const liveItems = ref<AdminCommandItem[]>([])
const isLoadingLive = ref(false)
const recentIds = ref<string[]>(readRecentIds())
let liveLoadedAt = 0
let liveLoadPromise: Promise<void> | null = null
let activeScrollToken = 0

function readRecentIds(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string').slice(0, MAX_RECENT_ITEMS) : []
  } catch {
    return []
  }
}

function writeRecentIds(ids: string[]) {
  try {
    localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(ids))
  } catch {
    // Ignore storage errors in restricted environments.
  }
}

export function isAdminCommandShortcut(event: KeyboardEvent): boolean {
  if (!(event.metaKey || event.ctrlKey) || event.altKey || event.shiftKey) return false
  return event.code === 'Space' || event.key === ' '
}

function highlightElement(element: HTMLElement) {
  element.scrollIntoView({ behavior: 'smooth', block: 'center' })
  element.classList.remove('admin-command-highlight')
  void element.offsetWidth
  element.classList.add('admin-command-highlight')
  window.setTimeout(() => {
    element.classList.remove('admin-command-highlight')
  }, 2200)
}

function findElementByText(root: ParentNode, targetText: string): HTMLElement | null {
  const normalized = targetText.trim().toLowerCase()
  if (!normalized) return null

  const candidates = root.querySelectorAll<HTMLElement>('h1, h2, h3, h4, label, button, [role="tab"], td, th, span')
  let partialMatch: HTMLElement | null = null

  for (const el of candidates) {
    const text = el.textContent?.trim().toLowerCase()
    if (!text) continue
    if (text === normalized) {
      return el.closest<HTMLElement>('section.admin-card, label, tr, [data-widget]') ?? el
    }
    if (!partialMatch && text.includes(normalized)) {
      partialMatch = el.closest<HTMLElement>('section.admin-card, label, tr, [data-widget]') ?? el
    }
  }

  return partialMatch
}

export async function scrollToAdminItem(options: { domId?: string; scrollText?: string }): Promise<void> {
  if (!options.domId && !options.scrollText) return
  const token = ++activeScrollToken

  await nextTick()

  for (let attempt = 0; attempt < 20; attempt++) {
    if (token !== activeScrollToken) return

    if (options.domId) {
      const byId = document.getElementById(options.domId)
      if (byId) {
        highlightElement(byId)
        return
      }
    }

    if (options.scrollText) {
      const main = document.querySelector('main') ?? document.body
      const byText = findElementByText(main, options.scrollText)
      if (byText) {
        highlightElement(byText)
        return
      }
    }

    await new Promise((resolve) => window.setTimeout(resolve, 75))
  }
}

export function useAdminCommandPalette() {
  function recordRecent(id: string) {
    const next = [id, ...recentIds.value.filter((entry) => entry !== id)].slice(0, MAX_RECENT_ITEMS)
    recentIds.value = next
    writeRecentIds(next)
  }

  async function loadLiveItems(force = false): Promise<void> {
    if (!force && liveItems.value.length > 0 && Date.now() - liveLoadedAt < LIVE_CACHE_TTL_MS) {
      return
    }
    if (liveLoadPromise) return liveLoadPromise

    isLoadingLive.value = true
    liveLoadPromise = (async () => {
      const [librariesRes, usersRes, pluginsRes, tasksRes, oidcRes, apiKeysRes, invitesRes, sharesRes] = await Promise.allSettled([
        listMediaLibraries(),
        listAdminUsers(),
        listPluginInstallations(),
        listAdminScheduledTasks(),
        listOidcClients(),
        listApiKeys(),
        listInvitations(),
        listNetworkShares(),
      ])

      const next: AdminCommandItem[] = []

      if (librariesRes.status === 'fulfilled') {
        for (const lib of librariesRes.value) {
          const locations = (lib.folders ?? []).map((folder) => folder.location || folder.path).filter(Boolean)
          next.push({
            id: `live:library:${lib.id}`,
            kind: 'library',
            title: lib.name,
            subtitle: [lib.type, ...locations].filter(Boolean).join(' • '),
            category: 'Libraries',
            icon: 'lucide:folder-open',
            keywords: ['library', lib.name, lib.type, ...locations],
            tab: 'library',
            page: 'libraries',
            scrollText: lib.name,
          })
        }
      }

      if (usersRes.status === 'fulfilled') {
        for (const user of usersRes.value) {
          next.push({
            id: `live:user:${user.id}`,
            kind: 'user',
            title: user.username,
            subtitle: [user.role, user.email].filter(Boolean).join(' • '),
            category: 'Users',
            icon: user.role === 'admin' ? 'lucide:shield-user' : 'lucide:user',
            keywords: ['user', user.username, user.email ?? '', user.role],
            tab: 'settings',
            page: 'users',
            scrollText: user.username,
          })
        }
      }

      if (pluginsRes.status === 'fulfilled') {
        for (const plugin of pluginsRes.value) {
          const pluginName = plugin.manifest?.name ?? plugin.id
          const pluginDescription = plugin.manifest?.description ?? ''
          next.push({
            id: `live:plugin:${plugin.id}`,
            kind: 'plugin',
            title: pluginName,
            subtitle: `${plugin.version}${plugin.enabled ? '' : ' • disabled'}`,
            category: 'Plugins',
            icon: 'lucide:puzzle',
            keywords: ['plugin', plugin.id, pluginName, pluginDescription],
            tab: 'plugins',
            page: 'plugins',
            pluginId: plugin.id,
          })
        }
      }

      if (tasksRes.status === 'fulfilled') {
        for (const task of tasksRes.value) {
          next.push({
            id: `live:task:${task.id}`,
            kind: 'task',
            title: task.name,
            subtitle: task.description || `${task.category} • ${task.cron}`,
            category: 'Scheduled Tasks',
            icon: 'lucide:clock',
            keywords: ['task', 'cron', task.id, task.name, task.category, task.description],
            tab: 'library',
            page: 'tasks',
            scrollText: task.name,
          })
        }
      }

      if (oidcRes.status === 'fulfilled') {
        for (const client of oidcRes.value) {
          next.push({
            id: `live:oauth:${client.id}`,
            kind: 'oauth',
            title: client.name,
            subtitle: `${client.type} • ${client.id}`,
            category: 'OAuth Applications',
            icon: 'lucide:shield-check',
            keywords: ['oauth', 'oidc', client.id, client.name, ...client.redirectUris],
            tab: 'users',
            page: 'oauth',
            scrollText: client.name,
          })
        }
      }

      if (apiKeysRes.status === 'fulfilled') {
        for (const key of apiKeysRes.value) {
          next.push({
            id: `live:apikey:${key.id}`,
            kind: 'apikey',
            title: key.name,
            subtitle: key.prefix ? `${key.prefix}…` : 'API Key',
            category: 'API Keys',
            icon: 'lucide:key-round',
            keywords: ['api key', 'token', key.name, key.prefix ?? ''],
            tab: 'users',
            page: 'apikeys',
            scrollText: key.name,
          })
        }
      }

      if (invitesRes.status === 'fulfilled') {
        for (const invite of invitesRes.value) {
          const title = invite.label || invite.code
          next.push({
            id: `live:invite:${invite.id}`,
            kind: 'invite',
            title,
            subtitle: `${invite.code} • ${invite.usedCount}${invite.maxUses ? `/${invite.maxUses}` : ''} used`,
            category: 'Invites',
            icon: 'lucide:ticket',
            keywords: ['invite', invite.code, invite.label ?? ''],
            tab: 'users',
            page: 'invites',
            scrollText: title,
          })
        }
      }

      if (sharesRes.status === 'fulfilled') {
        for (const share of sharesRes.value) {
          next.push({
            id: `live:share:${share.id}`,
            kind: 'share',
            title: share.name,
            subtitle: `${share.protocol} • ${share.host}`,
            category: 'Network Shares',
            icon: 'lucide:hard-drive',
            keywords: ['share', 'smb', 'nfs', share.name, share.host, share.protocol],
            tab: 'settings',
            page: 'networking',
            scrollText: share.name,
          })
        }
      }

      liveItems.value = next
      liveLoadedAt = Date.now()
    })().finally(() => {
      isLoadingLive.value = false
      liveLoadPromise = null
    })

    return liveLoadPromise
  }

  function open() {
    isOpen.value = true
    void loadLiveItems(false)
  }

  function close() {
    isOpen.value = false
  }

  function toggle() {
    if (isOpen.value) close()
    else open()
  }

  async function executeCommand(item: AdminCommandItem, router: Router) {
    recordRecent(item.id)
    close()

    if (item.run) {
      await item.run()
      return
    }

    if (item.routeName) {
      await router.push({ name: item.routeName })
      return
    }

    if (item.tab && item.page) {
      const query: Record<string, string> = { ...adminQuery(item.tab, item.page) }
      if (item.pluginId) query.plugin = item.pluginId

      if (router.currentRoute.value.name === 'admin') {
        await router.replace({ query })
      } else {
        await router.push({ name: 'admin', query })
      }

      await scrollToAdminItem({ domId: item.domId, scrollText: item.scrollText })
    }
  }

  return {
    isOpen,
    liveItems,
    isLoadingLive,
    recentIds,
    open,
    close,
    toggle,
    loadLiveItems,
    executeCommand,
  }
}
