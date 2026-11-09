<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { listSettings, updateSetting } from '../../api'
import { notify } from '../../composables/notify'
import { describeRequestError } from '../../composables/useProfile'
import { catchError } from '../../utils/catchError'
import AdminSection from './AdminSection.vue'
import AdminSkeleton from './AdminSkeleton.vue'
import AdminToggle from './AdminToggle.vue'

const SETTING_KEY = 'log_successful_api_requests'
const { t } = useI18n()
const enabled = ref(false)
const isLoading = ref(true)
const isSaving = ref(false)

async function load() {
  const [error, settings] = await catchError(listSettings())
  if (error) {
    console.error('[request-logging] failed to load settings', error)
    notify.error(describeRequestError(error, t('admin.requestLogging.loadFailed')))
    return
  }
  const setting = settings.find((item) => item.key === SETTING_KEY)
  if (!setting || typeof setting.value !== 'boolean') {
    console.error('[request-logging] setting is missing or invalid')
    notify.error(t('admin.requestLogging.loadFailed'))
    return
  }
  enabled.value = setting.value
}

async function save(value: boolean) {
  isSaving.value = true
  const [error, setting] = await catchError(updateSetting(SETTING_KEY, value))
  if (error) {
    console.error('[request-logging] failed to save setting', error)
    notify.error(describeRequestError(error, t('admin.requestLogging.saveFailed')))
    await load()
  } else if (typeof setting.value === 'boolean') {
    enabled.value = setting.value
    notify.success(t('admin.requestLogging.saved'))
  } else {
    console.error('[request-logging] server returned an invalid setting')
    notify.error(t('admin.requestLogging.saveFailed'))
    await load()
  }
  isSaving.value = false
}

onMounted(async () => {
  try {
    await load()
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <AdminSection :title="t('admin.requestLogging.title')" :description="t('admin.requestLogging.description')">
    <AdminSkeleton v-if="isLoading" variant="toggles" :rows="1" />
    <AdminToggle v-else :model-value="enabled" :label="t('admin.requestLogging.successfulRequests')" :description="t('admin.requestLogging.successfulRequestsDescription')" :disabled="isSaving" @update:model-value="save" />
  </AdminSection>
</template>
