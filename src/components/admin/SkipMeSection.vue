<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { listSettings, updateSetting } from '../../api'
import { notify } from '../../composables/notify'
import { describeRequestError } from '../../composables/useProfile'
import AdminSection from './AdminSection.vue'

const { t } = useI18n()

const url = ref('')
const loading = ref(true)
const saving = ref(false)
const error = ref('')

async function load() {
  try {
    const settings = await listSettings()
    const value = settings.find((setting) => setting.key === 'skipme_api_url')?.value
    url.value = typeof value === 'string' ? value : ''
    error.value = ''
  } catch (err: unknown) {
    error.value = describeRequestError(err, t('admin.indexer.skipmeError'))
  } finally {
    loading.value = false
  }
}

async function save() {
  saving.value = true
  try {
    await updateSetting('skipme_api_url', url.value.trim())
    notify.success(t('admin.indexer.skipmeSaved'))
    await load()
  } catch (err: unknown) {
    notify.error(describeRequestError(err, t('admin.indexer.skipmeError')))
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<template>
  <AdminSection :title="t('admin.indexer.skipmeTitle')" :description="t('admin.indexer.skipmeHint')">
    <p v-if="error" role="alert" class="mb-4 text-sm text-red-300">{{ error }}</p>
    <div class="flex flex-wrap items-end gap-4">
      <label class="block min-w-64 flex-1 text-xs text-flixer-muted">
        {{ t('admin.indexer.skipmeUrl') }}
        <input v-model="url" type="url" class="mt-1 w-full rounded-lg border border-flixer-border bg-flixer-background px-3 py-2 text-sm text-flixer-text placeholder:text-flixer-muted/60 focus-visible:outline-2 focus-visible:outline-flixer-accent" />
      </label>
      <button type="button" :disabled="saving || loading" class="rounded-lg bg-flixer-primary px-5 py-2 text-sm font-semibold text-white transition hover:bg-flixer-primary/80 disabled:opacity-50" @click="save">{{ t('admin.indexer.skipmeSave') }}</button>
    </div>
  </AdminSection>
</template>
