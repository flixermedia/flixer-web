<script setup lang="ts">
import { openModal } from '@kolirt/vue-modal'
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { listSettings, type IndexerSubtitleSetting } from '../../api'
import { describeRequestError } from '../../composables/useProfile'
import { catchError } from '../../utils/catchError'
import AdminSection from './AdminSection.vue'
import SubtitlesSettingsModal from './SubtitlesSettingsModal.vue'

const { t } = useI18n()

const stored = ref<Partial<IndexerSubtitleSetting> | undefined>()
const loading = ref(true)
const error = ref('')

async function load() {
  try {
    const [requestError, settings] = await catchError(listSettings())
    if (requestError) {
      error.value = describeRequestError(requestError, t('admin.indexer.subtitles.error'))
    } else {
      stored.value = settings.find((setting) => setting.key === 'indexer_subtitles')?.value as Partial<IndexerSubtitleSetting> | undefined
      error.value = ''
    }
  } finally {
    loading.value = false
  }
}

async function configure() {
  const saved = await openModal<boolean>(SubtitlesSettingsModal, { props: { stored: stored.value } }).catch(() => false)
  if (saved) await load()
}

onMounted(load)
</script>

<template>
  <AdminSection :title="t('admin.indexer.subtitles.title')" :description="t('admin.indexer.subtitles.description')">
    <template #actions>
      <button type="button" :disabled="loading" class="rounded bg-flixer-primary px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-flixer-primary/80 disabled:opacity-50" @click="configure">{{ t('admin.indexer.subtitles.configure') }}</button>
      <span v-if="!error && !loading" class="text-xs text-flixer-muted">{{ stored?.apiKey ? t('admin.indexer.subtitles.configured') : t('admin.indexer.subtitles.notConfigured') }}</span>
    </template>

    <p v-if="error" role="alert" class="text-sm text-red-300">{{ error }}</p>
  </AdminSection>
</template>
