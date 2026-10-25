<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { listSettings, syncThemes, updateSetting } from '../../api'
import { notify } from '../../composables/notify'
import { describeRequestError } from '../../composables/useProfile'
import AdminSection from './AdminSection.vue'
import AdminToggle from './AdminToggle.vue'

const { t } = useI18n()
const enabled = ref(false)
const syncing = ref(false)
const loading = ref(true)

onMounted(async () => {
  try {
    enabled.value = (await listSettings()).find((entry) => entry.key === 'themes_enabled')?.value === true
  } catch (error) {
    notify.error(describeRequestError(error, t('admin.themes.loadError')))
  } finally {
    loading.value = false
  }
})

async function setEnabled(value: boolean) {
  const previous = enabled.value
  enabled.value = value
  try {
    await updateSetting('themes_enabled', value)
  } catch (error) {
    enabled.value = previous
    notify.error(describeRequestError(error, t('admin.themes.saveError')))
  }
}

async function downloadExisting() {
  syncing.value = true
  try {
    const result = await syncThemes()
    notify.success(t('admin.themes.queued', { queued: result.queued, eligible: result.eligible }))
  } catch (error) {
    notify.error(describeRequestError(error, t('admin.themes.syncError')))
  } finally {
    syncing.value = false
  }
}
</script>

<template>
  <AdminSection :title="t('admin.themes.title')" :description="t('admin.themes.description')">
    <AdminToggle :model-value="enabled" :label="t('admin.themes.enabled')" :description="t('admin.themes.toggleHint')" @update:model-value="setEnabled" />
    <ul class="mt-3 space-y-2 rounded-xl border border-flixer-border bg-flixer-background/40 p-4 text-sm leading-6 text-flixer-muted">
      <li>{{ t('admin.themes.attribution') }}</li>
      <li>{{ t('admin.themes.downloadInfo') }}</li>
      <li>{{ t('admin.themes.storageInfo') }}</li>
    </ul>
    <div class="mt-4 flex flex-wrap items-center gap-3">
      <button type="button" :disabled="!enabled || loading || syncing" class="rounded-lg bg-flixer-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-flixer-primary/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent disabled:cursor-not-allowed disabled:opacity-50" @click="downloadExisting">{{ syncing ? t('admin.themes.syncing') : t('admin.themes.sync') }}</button>
      <span v-if="!enabled" class="text-xs text-flixer-muted">{{ t('admin.themes.enableFirst') }}</span>
    </div>
  </AdminSection>
</template>
