<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { listSettings, updateSetting, type IndexerSubtitleSetting } from '../../api'
import { notify } from '../../composables/notify'
import { describeRequestError } from '../../composables/useProfile'
import AdminSection from './AdminSection.vue'
import AdminToggle from './AdminToggle.vue'

const { t } = useI18n()

const SECRET_MASK = '********'

const apiKey = ref('')
const password = ref('')
const username = ref('')
const languages = ref('')
const autoFetch = ref(true)
const hasKey = ref(false)
const hasPassword = ref(false)
const loading = ref(true)
const saving = ref(false)
const error = ref('')

const inputClass = 'mt-1 w-full rounded border border-flixer-border bg-flixer-background px-3 py-2 text-sm text-flixer-text'

async function load() {
  try {
    const settings = await listSettings()
    const stored = settings.find((setting) => setting.key === 'indexer_subtitles')?.value as Partial<IndexerSubtitleSetting> | undefined
    hasKey.value = Boolean(stored?.apiKey)
    hasPassword.value = Boolean(stored?.password)
    username.value = stored?.username ?? ''
    languages.value = (stored?.languages ?? []).join(', ')
    autoFetch.value = stored?.autoFetch !== false
    apiKey.value = ''
    password.value = ''
    error.value = ''
  } catch (err: unknown) {
    error.value = describeRequestError(err, t('admin.indexer.subtitles.error'))
  } finally {
    loading.value = false
  }
}

async function save() {
  saving.value = true
  try {
    // An empty box keeps a saved secret; a typed value replaces it.
    const value: IndexerSubtitleSetting = {
      apiKey: apiKey.value.trim() || (hasKey.value ? SECRET_MASK : ''),
      username: username.value.trim(),
      password: password.value || (hasPassword.value ? SECRET_MASK : ''),
      languages: languages.value.split(/[\s,]+/).filter(Boolean),
      autoFetch: autoFetch.value,
    }
    await updateSetting('indexer_subtitles', value)
    notify.success(t('admin.indexer.subtitles.saved'))
    await load()
  } catch (err: unknown) {
    notify.error(describeRequestError(err, t('admin.indexer.subtitles.error')))
  } finally {
    saving.value = false
  }
}

async function clearCredentials() {
  saving.value = true
  try {
    await updateSetting('indexer_subtitles', {
      apiKey: '',
      username: username.value.trim(),
      password: '',
      languages: languages.value.split(/[\s,]+/).filter(Boolean),
      autoFetch: autoFetch.value,
    })
    notify.success(t('admin.indexer.subtitles.saved'))
    await load()
  } catch (err: unknown) {
    notify.error(describeRequestError(err, t('admin.indexer.subtitles.error')))
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<template>
  <AdminSection :title="t('admin.indexer.subtitles.title')" :description="t('admin.indexer.subtitles.description')">
    <template #actions>
      <button type="button" :disabled="saving || loading" class="rounded bg-flixer-primary px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-flixer-primary/80 disabled:opacity-50" @click="save">{{ t('admin.indexer.subtitles.save') }}</button>
    </template>

    <p v-if="error" role="alert" class="mb-3 text-sm text-red-300">{{ error }}</p>

    <div class="grid gap-4 md:grid-cols-2">
      <label class="block text-xs text-flixer-muted">
        {{ t('admin.indexer.apiKey') }}
        <input v-model="apiKey" type="password" autocomplete="off" :placeholder="hasKey ? '••••••••' : t('admin.indexer.apiKeyPlaceholder')" :class="inputClass" />
        <span v-if="hasKey" class="mt-1 block">{{ t('admin.indexer.keyStored') }}</span>
        <span v-else class="mt-1 block">{{ t('admin.indexer.subtitles.keyHint') }}</span>
      </label>

      <label class="block text-xs text-flixer-muted">
        {{ t('admin.indexer.subtitles.languages') }}
        <input v-model="languages" type="text" maxlength="80" placeholder="en, es" :class="inputClass" />
        <span class="mt-1 block">{{ t('admin.indexer.subtitles.languagesHint') }}</span>
      </label>

      <label class="block text-xs text-flixer-muted">
        {{ t('admin.indexer.subtitles.username') }}
        <input v-model="username" type="text" autocomplete="off" maxlength="128" :class="inputClass" />
      </label>

      <label class="block text-xs text-flixer-muted">
        {{ t('admin.indexer.subtitles.password') }}
        <input v-model="password" type="password" autocomplete="new-password" :placeholder="hasPassword ? '••••••••' : ''" :class="inputClass" />
        <span class="mt-1 block">{{ t('admin.indexer.subtitles.loginHint') }}</span>
      </label>
    </div>

    <div class="mt-4 flex flex-wrap items-center justify-between gap-3">
      <AdminToggle v-model="autoFetch" :label="t('admin.indexer.subtitles.autoFetch')" :description="t('admin.indexer.subtitles.autoFetchHint')" />
      <button v-if="hasKey" type="button" :disabled="saving" class="rounded border border-flixer-border px-3 py-1.5 text-xs text-flixer-muted transition hover:text-flixer-text disabled:opacity-50" @click="clearCredentials">{{ t('admin.indexer.subtitles.remove') }}</button>
    </div>
  </AdminSection>
</template>
