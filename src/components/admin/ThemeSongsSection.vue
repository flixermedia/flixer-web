<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { listSettings, syncThemes, updateSetting } from '../../api'
import { notify } from '../../composables/notify'
import { describeRequestError } from '../../composables/useProfile'
import { catchError } from '../../utils/catchError'
import AdminSection from './AdminSection.vue'
import AdminToggle from './AdminToggle.vue'

const { t } = useI18n()
const enabled = ref(false)
const syncing = ref(false)
const loading = ref(true)

onMounted(async () => {
  try {
    const [error, settings] = await catchError(listSettings())
    if (error) {
      notify.error(describeRequestError(error, t('admin.themes.loadError')))
    } else {
      enabled.value = settings.find((entry) => entry.key === 'themes_enabled')?.value === true
    }
  } finally {
    loading.value = false
  }
})

async function setEnabled(value: boolean) {
  const previous = enabled.value
  enabled.value = value
  const [error] = await catchError(updateSetting('themes_enabled', value))
  if (error) {
    enabled.value = previous
    notify.error(describeRequestError(error, t('admin.themes.saveError')))
  }
}

async function downloadExisting() {
  syncing.value = true
  try {
    const [error, result] = await catchError(syncThemes())
    if (error) {
      notify.error(describeRequestError(error, t('admin.themes.syncError')))
    } else {
      notify.success(t('admin.themes.queued', { queued: result.queued, eligible: result.eligible }))
    }
  } finally {
    syncing.value = false
  }
}
</script>

<template>
  <AdminSection :title="t('admin.themes.title')" :description="t('admin.themes.description')">
    <AdminToggle :model-value="enabled" :label="t('admin.themes.enabled')" :description="t('admin.themes.toggleHint')" @update:model-value="setEnabled" />
    <ul class="mt-3 space-y-2 rounded border border-flixer-border bg-flixer-background/40 p-4 text-sm leading-6 text-flixer-muted">
      <li>{{ t('admin.themes.attribution') }}</li>
      <li>{{ t('admin.themes.downloadInfo') }}</li>
      <li>{{ t('admin.themes.storageInfo') }}</li>
    </ul>
    <div class="mt-4 flex flex-wrap items-center gap-3">
      <button type="button" :disabled="!enabled || loading || syncing" class="rounded bg-flixer-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-flixer-primary/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent disabled:cursor-not-allowed disabled:opacity-50" @click="downloadExisting">{{ syncing ? t('admin.themes.syncing') : t('admin.themes.sync') }}</button>
      <span v-if="!enabled" class="text-xs text-flixer-muted">{{ t('admin.themes.enableFirst') }}</span>
    </div>
  </AdminSection>
</template>
