import { ref } from 'vue'

const maintenanceActive = ref(false)
const maintenancePreview = ref(false)

/** Tracks whether the server/proxy has signaled an active update maintenance window. */
export function useMaintenanceMode() {
  function enterMaintenance(preview = false) {
    maintenanceActive.value = true
    maintenancePreview.value = preview
  }

  function exitMaintenance() {
    maintenanceActive.value = false
    maintenancePreview.value = false
  }

  return {
    maintenanceActive,
    maintenancePreview,
    enterMaintenance,
    exitMaintenance,
  }
}
