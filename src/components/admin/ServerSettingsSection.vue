<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { listSettings, updateSetting, type ServerSetting } from '../../api'
import { notify } from '../../composables/notify'
import { describeRequestError } from '../../composables/useProfile'
import { catchError } from '../../utils/catchError'
import AdminSection from './AdminSection.vue'
import AdminSkeleton from './AdminSkeleton.vue'

const { t } = useI18n()
const form = reactive({ name: '', banner: '' })
const saved = reactive({ name: '', banner: '' })
const isLoading = ref(true)
const isSaving = ref(false)

const inputClass = 'mt-1 w-full rounded border border-flixer-border bg-flixer-background px-3 py-2 text-sm text-flixer-text'
const button = 'rounded bg-flixer-primary px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-flixer-primary/80 disabled:opacity-60'

function text(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

async function load() {
  try {
    const [error, settings] = await catchError(listSettings())
    if (error) {
      console.error('[server] failed to load settings', error)
      notify.error(describeRequestError(error, t('admin.general.serverLoadFailed')))
    } else {
      const values = Object.fromEntries(settings.map((setting: ServerSetting) => [setting.key, setting.value]))
      saved.name = text(values.server_name)
      saved.banner = text(values.login_banner)
      Object.assign(form, { name: saved.name, banner: saved.banner })
    }
  } finally {
    isLoading.value = false
  }
}

async function save() {
  isSaving.value = true
  try {
    let requestError: Error | undefined
    if (form.name.trim() !== saved.name) {
      ;[requestError] = await catchError(updateSetting('server_name', form.name.trim() || null))
    }
    if (!requestError && form.banner.trim() !== saved.banner) {
      ;[requestError] = await catchError(updateSetting('login_banner', form.banner.trim()))
    }
    if (requestError) {
      console.error('[server] failed to save settings', requestError)
      notify.error(describeRequestError(requestError, t('admin.general.serverSaveFailed')))
    } else {
      notify.success(t('admin.general.serverSaved'))
    }
  } finally {
    isSaving.value = false
    await load()
  }
}

onMounted(load)
</script>

<template>
  <AdminSection :title="t('admin.general.title')" :description="t('admin.general.description')">
    <template #actions>
      <button type="button" :class="button" :disabled="isLoading || isSaving" @click="save">{{ t('common.save') }}</button>
    </template>
    <AdminSkeleton v-if="isLoading" variant="fields" :rows="2" />
    <div v-else class="grid gap-4">
      <label class="text-xs text-flixer-muted">
        {{ t('admin.general.serverName') }}
        <input v-model="form.name" maxlength="100" autocomplete="off" :class="inputClass" />
      </label>
      <label class="text-xs text-flixer-muted">
        {{ t('admin.general.loginBanner') }}
        <textarea v-model="form.banner" rows="3" maxlength="500" :class="inputClass" :placeholder="t('admin.general.loginBannerPlaceholder')"></textarea>
        <span class="mt-1 block">{{ t('admin.general.loginBannerHint') }}</span>
      </label>
    </div>
  </AdminSection>
</template>
