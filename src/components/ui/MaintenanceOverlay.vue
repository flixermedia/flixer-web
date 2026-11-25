<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { apiRequest } from '../../api/client'
import { useMaintenanceMode } from '../../composables/useMaintenanceMode'

const { t } = useI18n()
const { maintenanceActive, maintenancePreview, exitMaintenance } = useMaintenanceMode()
const checking = ref(false)
let pollTimer: ReturnType<typeof setTimeout> | undefined

async function checkServer(manual = false) {
  if (!maintenanceActive.value || maintenancePreview.value) return
  if (manual) checking.value = true
  try {
    const response = await apiRequest<{ maintenance?: boolean }>({ url: '/setup/status', method: 'get', timeout: 4000 })
    if (response.status >= 200 && response.status < 300 && response.data?.maintenance !== true) {
      exitMaintenance()
      return
    }
  } catch {
    // Still updating or in maintenance; try again on next tick.
  } finally {
    if (manual) checking.value = false
  }
  clearTimeout(pollTimer)
  pollTimer = setTimeout(() => void checkServer(false), 4000)
}

onMounted(() => {
  if (!maintenancePreview.value) {
    pollTimer = setTimeout(() => void checkServer(false), 4000)
  }
})

onBeforeUnmount(() => {
  clearTimeout(pollTimer)
})
</script>

<template>
  <div class="flixer-modal-overlay z-[200] grid place-items-center p-6 text-flixer-text" role="status" aria-live="polite">
    <div class="flixer-modal-card w-full max-w-md rounded-lg border border-flixer-border bg-flixer-surface p-8 text-center shadow-2xl">
      <div class="mx-auto mb-5 grid size-14 place-items-center rounded-full bg-flixer-primary/15 text-flixer-accent">
        <Icon icon="lucide:wrench" class="size-7" aria-hidden="true" />
      </div>
      <h1 class="text-xl font-semibold tracking-tight text-flixer-text">{{ t('maintenance.title') }}</h1>
      <p class="mt-2.5 text-sm leading-relaxed text-flixer-muted">{{ t('maintenance.description') }}</p>
      <p class="mt-4 text-xs text-flixer-muted/80">{{ checking ? t('maintenance.checking') : t('maintenance.autoReload') }}</p>
      <div class="mt-6 flex justify-center gap-3">
        <button v-if="!maintenancePreview" type="button"
          class="inline-flex items-center gap-2 rounded border border-flixer-border bg-flixer-background/60 px-4 py-2 text-sm font-semibold text-flixer-text transition hover:bg-flixer-background"
          :disabled="checking" @click="checkServer(true)">
          <Icon icon="lucide:rotate-cw" class="size-4" aria-hidden="true" />
          {{ t('maintenance.checkNow') }}
        </button>
        <button v-else type="button"
          class="inline-flex items-center gap-2 rounded bg-flixer-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-flixer-primary/80"
          @click="exitMaintenance()">
          {{ t('maintenance.exitPreview') }}
        </button>
      </div>
    </div>
  </div>
</template>
