<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { listSettings, updateSetting } from '../../api'
import { notify } from '../../composables/notify'
import { describeRequestError } from '../../composables/useProfile'
import { catchError } from '../../utils/catchError'
import AdminSection from './AdminSection.vue'
import AdminToggle from './AdminToggle.vue'

const { t } = useI18n()
const enabled = ref(false)
const loading = ref(true)
const saving = ref(false)

onMounted(async () => {
  const [error, settings] = await catchError(listSettings())
  if (error) notify.error(describeRequestError(error, t('admin.trailers.loadError')))
  else enabled.value = settings.find((entry) => entry.key === 'trailers_cache_enabled')?.value === true
  loading.value = false
})

async function setEnabled(value: boolean) {
  saving.value = true
  const [error] = await catchError(updateSetting('trailers_cache_enabled', value))
  if (error) notify.error(describeRequestError(error, t('admin.trailers.saveError')))
  else enabled.value = value
  saving.value = false
}
</script>

<template>
  <AdminSection :title="t('admin.trailers.title')" :description="t('admin.trailers.description')">
    <AdminToggle :model-value="enabled" :disabled="loading || saving" :label="t('admin.trailers.cache')" :description="t('admin.trailers.cacheDescription')" @update:model-value="setEnabled" />
    <p class="mt-3 text-sm text-flixer-muted">{{ t('admin.trailers.storage') }}</p>
  </AdminSection>
</template>
