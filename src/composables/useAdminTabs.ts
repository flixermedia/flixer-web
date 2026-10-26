import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { listPluginAdminPages, type PluginAdminPageEntry } from '../api'
import type { AdminTabItem } from '../components/admin/AdminTabs.vue'
import { ADMIN_TAB_IDS, pagesOf, pluginPageId } from '../components/admin/adminNav'

const pluginPages = ref<PluginAdminPageEntry[]>([])

/** Reloads the settings pages that enabled plugins contribute; call after a plugin is enabled, disabled or removed. */
export async function refreshPluginAdminPages() {
  try {
    pluginPages.value = await listPluginAdminPages()
  } catch {
    pluginPages.value = []
  }
}

/** Pages that plugins add to the admin navigation. */
export function usePluginAdminPages() {
  return computed(() => pluginPages.value.map((page) => ({ ...page, key: pluginPageId(page.pluginId, page.id) })))
}

/** The admin tab bar with its dropdown pages, labelled in the current language. */
export function useAdminTabs() {
  const { t } = useI18n()
  const extra = usePluginAdminPages()
  return computed<AdminTabItem[]>(() =>
    ADMIN_TAB_IDS.map((id) => ({
      id,
      label: t(`admin.groups.${id}`),
      pages: [...pagesOf(id).map((page) => ({ id: page, label: t(`admin.pages.${page}`) })), ...extra.value.filter((page) => page.section === id).map((page) => ({ id: page.key, label: page.title }))],
    })),
  )
}
