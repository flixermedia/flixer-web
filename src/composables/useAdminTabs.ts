import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ADMIN_TAB_IDS, pagesOf, type AdminTabItem } from '../components/admin/adminNav'

/** The admin tab bar with its dropdown pages, labelled in the current language. */
export function useAdminTabs() {
  const { t } = useI18n()
  return computed<AdminTabItem[]>(() => ADMIN_TAB_IDS.map((id) => ({ id, label: t(`admin.groups.${id}`), pages: pagesOf(id).map((page) => ({ id: page, label: t(`admin.pages.${page}`) })) })))
}
