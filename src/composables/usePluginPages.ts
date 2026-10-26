import { computed, ref } from 'vue'
import { listPluginPages, type PluginPageEntry } from '../api'
import { useProfile } from './useProfile'

const pages = ref<PluginPageEntry[]>([])
const loaded = ref(false)
let pending: Promise<void> | null = null

function load(force = false): Promise<void> {
  if (!force && loaded.value) return Promise.resolve()
  pending ??= listPluginPages()
    .then((result) => {
      pages.value = result
      loaded.value = true
    })
    .catch(() => {
      pages.value = []
    })
    .finally(() => {
      pending = null
    })
  return pending
}

/** Re-reads the plugin pages; call after plugins are enabled, disabled, installed or uninstalled. */
export function refreshPluginPages(): Promise<void> {
  return load(true)
}

export function clearPluginPages() {
  pages.value = []
  loaded.value = false
}

/** Pages that belong in the main navigation for the current user. */
export function usePluginPages() {
  const { profile } = useProfile()
  const mainPages = computed(() => pages.value.filter((page) => page.nav === 'main' && (!page.adminOnly || profile.value?.role === 'admin')))
  return { pages, mainPages, load, refresh: refreshPluginPages }
}

export function pagePath(page: Pick<PluginPageEntry, 'pluginId' | 'id'>): string {
  return `/plugins/${encodeURIComponent(page.pluginId)}/${encodeURIComponent(page.id)}`
}
