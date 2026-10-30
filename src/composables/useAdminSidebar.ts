import { ref } from 'vue'

const STORAGE_KEY = 'flixer.admin-sidebar-compact'

function readCompactPreference() {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

const compact = ref(readCompactPreference())

export function useAdminSidebar() {
  function toggleCompact() {
    compact.value = !compact.value
    try {
      localStorage.setItem(STORAGE_KEY, String(compact.value))
    } catch {
      // Keep the compact preference for this session if storage is unavailable.
    }
  }

  return { compact, toggleCompact }
}
