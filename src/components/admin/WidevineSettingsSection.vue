<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { listSettings, updateSetting, type ServerSetting } from '../../api'
import { notify } from '../../composables/notify'
import { describeRequestError } from '../../composables/useProfile'
import { applyWidevinePlaybackSettings } from '../player/adaptivePlayback'
import { catchError } from '../../utils/catchError'
import AdminSection from './AdminSection.vue'
import AdminSkeleton from './AdminSkeleton.vue'
import AdminToggle from './AdminToggle.vue'

const { t } = useI18n()
const emit = defineEmits<{ saved: [] }>()
const enabled = ref(false)
const licenseUrl = ref('')
const savedEnabled = ref(false)
const savedLicenseUrl = ref('')
const isLoading = ref(true)
const isSaving = ref(false)

async function load() {
  const [error, settings] = await catchError(listSettings())
  if (error) {
    console.error('[widevine] failed to load settings', error)
    notify.error(describeRequestError(error, t('admin.drm.widevine.loadError')))
    return
  }
  const value = (key: string) => settings.find((setting: ServerSetting) => setting.key === key)?.value
  const currentEnabled = value('widevine_drm_enabled')
  const currentUrl = value('widevine_license_server_url')
  if (typeof currentEnabled !== 'boolean' || typeof currentUrl !== 'string') {
    console.error('[widevine] settings are missing or invalid')
    notify.error(t('admin.drm.widevine.loadError'))
    return
  }
  savedEnabled.value = currentEnabled
  savedLicenseUrl.value = currentUrl
  enabled.value = currentEnabled
  licenseUrl.value = currentUrl
  applyWidevinePlaybackSettings(currentEnabled, currentUrl)
}

async function save() {
  const nextUrl = licenseUrl.value.trim()
  if (enabled.value && !nextUrl) {
    notify.error(t('admin.drm.widevine.licenseRequired'))
    return
  }
  isSaving.value = true
  try {
    let requestError: Error | undefined
    if (nextUrl !== savedLicenseUrl.value) {
      ;[requestError] = await catchError(updateSetting('widevine_license_server_url', nextUrl))
    }
    if (!requestError && enabled.value !== savedEnabled.value) {
      ;[requestError] = await catchError(updateSetting('widevine_drm_enabled', enabled.value))
    }
    if (requestError) {
      console.error('[widevine] failed to save settings', requestError)
      notify.error(describeRequestError(requestError, t('admin.drm.widevine.saveError')))
      return
    }
    savedLicenseUrl.value = nextUrl
    savedEnabled.value = enabled.value
    applyWidevinePlaybackSettings(enabled.value, nextUrl)
    emit('saved')
    notify.success(t('admin.drm.widevine.saved'))
  } finally {
    isSaving.value = false
    if (enabled.value !== savedEnabled.value || licenseUrl.value.trim() !== savedLicenseUrl.value) {
      await load()
    }
  }
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
  <AdminSection :title="t('admin.drm.widevine.title')" :description="t('admin.drm.widevine.description')">
    <AdminSkeleton v-if="isLoading" variant="fields" :rows="2" />
    <div v-else class="space-y-4">
      <AdminToggle
        v-model="enabled"
        :label="t('admin.drm.widevine.enable')"
        :description="t('admin.drm.widevine.enableDescription')"
        :disabled="isSaving"
      />
      <label class="block text-xs text-flixer-muted">
        {{ t('admin.drm.widevine.licenseServerUrl') }}
        <input
          v-model="licenseUrl"
          type="url"
          maxlength="2048"
          autocomplete="url"
          spellcheck="false"
          class="mt-1 w-full rounded border border-flixer-border bg-flixer-background px-3 py-2 font-mono text-sm text-flixer-text"
          :disabled="isSaving"
          :placeholder="t('admin.drm.widevine.licenseServerPlaceholder')"
        />
      </label>
      <p class="text-xs text-flixer-muted">{{ t('admin.drm.widevine.publicUrlWarning') }}</p>
      <button
        type="button"
        class="rounded bg-flixer-primary px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-flixer-primary/80 disabled:opacity-60"
        :disabled="isSaving"
        @click="save"
      >
        {{ t('common.save') }}
      </button>
    </div>
  </AdminSection>
</template>
