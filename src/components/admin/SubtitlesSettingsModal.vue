<script setup lang="ts">
import { ModalContent, ModalDescription, ModalRoot, ModalTitle, useModalContext } from '@kolirt/vue-modal'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { updateSetting, type IndexerSubtitleSetting } from '../../api'
import { notify } from '../../composables/notify'
import { describeRequestError } from '../../composables/useProfile'
import { catchError } from '../../utils/catchError'
import AdminToggle from './AdminToggle.vue'

defineOptions({ modalGroup: 'default' })

const props = defineProps<{ stored?: Partial<IndexerSubtitleSetting> }>()

const { close, confirm } = useModalContext<boolean>()
const { t } = useI18n()

const SECRET_MASK = '********'

const hasKey = Boolean(props.stored?.apiKey)
const hasPassword = Boolean(props.stored?.password)
const apiKey = ref('')
const password = ref('')
const username = ref(props.stored?.username ?? '')
const languages = ref((props.stored?.languages ?? []).join(', '))
const autoFetch = ref(props.stored?.autoFetch !== false)
const saving = ref(false)
const formError = ref('')

const inputClass = 'rounded border border-flixer-border bg-flixer-background px-3 py-1.5 text-sm text-flixer-text'

async function persist(clear: boolean) {
  saving.value = true
  formError.value = ''
  // An empty box keeps a saved secret; a typed value replaces it.
  const value: IndexerSubtitleSetting = {
    apiKey: clear ? '' : apiKey.value.trim() || (hasKey ? SECRET_MASK : ''),
    username: username.value.trim(),
    password: clear ? '' : password.value || (hasPassword ? SECRET_MASK : ''),
    languages: languages.value.split(/[\s,]+/).filter(Boolean),
    autoFetch: autoFetch.value,
  }
  try {
    const [error] = await catchError(updateSetting('indexer_subtitles', { ...value }))
    if (error) {
      formError.value = describeRequestError(error, t('admin.indexer.subtitles.error'))
    } else {
      notify.success(t('admin.indexer.subtitles.saved'))
      confirm(true)
    }
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <ModalRoot class="flex items-center justify-center p-4">
    <ModalContent class="flixer-modal-card flex max-h-[calc(100dvh-2rem)] w-full max-w-lg flex-col rounded border border-flixer-border bg-flixer-surface p-6 text-flixer-text shadow-2xl shadow-black/60">
      <header class="flixer-modal-header">
        <ModalTitle class="shrink-0 text-lg font-semibold">{{ t('admin.indexer.subtitles.title') }}</ModalTitle>
        <ModalDescription class="mt-1 shrink-0 text-sm leading-6 text-flixer-muted">{{ t('admin.indexer.subtitles.description') }}</ModalDescription>
      </header>
      <form class="flixer-modal-form mt-5" @submit.prevent="persist(false)">
        <div class="flixer-modal-form-body gap-4">
          <div class="grid gap-3 sm:grid-cols-2">
            <label class="flex flex-col gap-1 text-xs text-flixer-muted">
              {{ t('admin.indexer.apiKey') }}
              <input v-model="apiKey" type="password" autocomplete="off" :placeholder="hasKey ? '••••••••' : t('admin.indexer.apiKeyPlaceholder')" :class="inputClass" />
              <span>{{ hasKey ? t('admin.indexer.keyStored') : t('admin.indexer.subtitles.keyHint') }}</span>
            </label>
            <label class="flex flex-col gap-1 text-xs text-flixer-muted">
              {{ t('admin.indexer.subtitles.languages') }}
              <input v-model="languages" type="text" maxlength="80" placeholder="en, es" :class="inputClass" />
              <span>{{ t('admin.indexer.subtitles.languagesHint') }}</span>
            </label>
            <label class="flex flex-col gap-1 text-xs text-flixer-muted">
              {{ t('admin.indexer.subtitles.username') }}
              <input v-model="username" type="text" autocomplete="off" maxlength="128" :class="inputClass" />
            </label>
            <label class="flex flex-col gap-1 text-xs text-flixer-muted">
              {{ t('admin.indexer.subtitles.password') }}
              <input v-model="password" type="password" autocomplete="new-password" :placeholder="hasPassword ? '••••••••' : ''" :class="inputClass" />
              <span>{{ t('admin.indexer.subtitles.loginHint') }}</span>
            </label>
          </div>
          <AdminToggle v-model="autoFetch" :label="t('admin.indexer.subtitles.autoFetch')" :description="t('admin.indexer.subtitles.autoFetchHint')" />
          <p v-if="formError" role="alert" class="text-sm text-red-300">{{ formError }}</p>
        </div>
        <div class="flixer-modal-actions flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
          <button v-if="hasKey" type="button" :disabled="saving" class="h-11 rounded border border-flixer-border px-6 text-sm text-flixer-muted transition hover:text-flixer-text disabled:opacity-50 sm:mr-auto" @click="persist(true)">{{ t('admin.indexer.subtitles.remove') }}</button>
          <button type="button" :disabled="saving" class="h-11 rounded border border-flixer-border px-6 text-sm font-semibold transition hover:bg-white/5" @click="close()">{{ t('admin.networkShares.cancel') }}</button>
          <button type="submit" :disabled="saving" class="h-11 rounded bg-flixer-primary px-6 text-sm font-semibold text-white transition hover:bg-flixer-primary/80 disabled:opacity-50">{{ t('admin.indexer.subtitles.save') }}</button>
        </div>
      </form>
    </ModalContent>
  </ModalRoot>
</template>
