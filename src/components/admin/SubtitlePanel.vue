<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdminSkeleton from './AdminSkeleton.vue'
import { deleteItemSubtitle, downloadItemSubtitle, listItemSubtitles, searchItemSubtitles, type SubtitleFile, type SubtitleSearchResult } from '../../api'
import { confirmAction } from '../../composables/confirm'
import { notify } from '../../composables/notify'
import { languageName } from '../../composables/subtitles'
import { describeRequestError } from '../../composables/useProfile'
import { catchError } from '../../utils/catchError'

const props = defineProps<{ itemId: string }>()
const emit = defineEmits<{ changed: [] }>()

const { t, locale } = useI18n()

const LANGUAGES = ['en', 'es', 'fr', 'de', 'it', 'pt-BR', 'pt-PT', 'nl', 'sv', 'no', 'da', 'fi', 'pl', 'cs', 'hu', 'ro', 'el', 'tr', 'ru', 'uk', 'ar', 'he', 'hi', 'th', 'vi', 'id', 'ja', 'ko', 'zh-CN', 'zh-TW']

const tracks = ref<SubtitleFile[]>([])
const configured = ref(true)
const loading = ref(true)
const loadError = ref('')
const searching = ref(false)
const searched = ref(false)
const searchError = ref('')
const downloading = ref<number | null>(null)
const results = ref<SubtitleSearchResult[]>([])
const query = ref('')
const language = ref(LANGUAGES.find((code) => code.toLowerCase() === locale.value.toLowerCase()) ?? LANGUAGES.find((code) => code === locale.value.split('-')[0]) ?? 'en')

const languageOptions = computed(() => LANGUAGES.map((code) => ({ code, name: `${languageName(code, locale.value)} (${code})` })))
const inputClass = 'h-9 rounded border border-flixer-border bg-flixer-background px-3 text-sm text-flixer-text'

function trackLabel(track: SubtitleFile) {
  const name = languageName(track.language, locale.value)
  return track.label ? `${name} (${track.label})` : name
}

async function load() {
  loading.value = true
  loadError.value = ''
  try {
    const [error, data] = await catchError(listItemSubtitles(props.itemId))
    if (error) {
      loadError.value = describeRequestError(error, t('subtitles.loadError'))
    } else {
      tracks.value = data.tracks
      configured.value = data.configured
    }
  } finally {
    loading.value = false
  }
}

async function search() {
  searching.value = true
  searchError.value = ''
  try {
    const [error, found] = await catchError(searchItemSubtitles(props.itemId, { query: query.value.trim() || undefined, languages: [language.value] }))
    if (error) {
      results.value = []
      searchError.value = describeRequestError(error, t('subtitles.searchError'))
    } else {
      results.value = found
    }
  } finally {
    searched.value = true
    searching.value = false
  }
}

async function download(result: SubtitleSearchResult) {
  downloading.value = result.fileId
  try {
    const [error] = await catchError(downloadItemSubtitle(props.itemId, result.fileId, language.value))
    if (error) {
      notify.error(describeRequestError(error, t('subtitles.downloadError')))
    } else {
      notify.success(t('subtitles.downloaded'))
      await load()
      emit('changed')
    }
  } finally {
    downloading.value = null
  }
}

async function remove(track: SubtitleFile) {
  if (!(await confirmAction(t('subtitles.confirmRemove', { file: track.file }), { danger: true }))) return
  const [error] = await catchError(deleteItemSubtitle(props.itemId, track.file))
  if (error) {
    notify.error(describeRequestError(error, t('subtitles.removeError')))
  } else {
    notify.success(t('subtitles.removed'))
    await load()
    emit('changed')
  }
}

onMounted(load)
</script>

<template>
  <section class="grid gap-4" :aria-label="t('subtitles.title')">
    <h3 class="text-xs font-semibold text-flixer-muted">{{ t('subtitles.title') }}</h3>

    <AdminSkeleton v-if="loading" variant="tracks" />
    <p v-else-if="loadError" role="alert" class="text-xs text-red-300">{{ loadError }}</p>
    <template v-else>
      <div>
        <p class="mb-1 text-xs text-flixer-muted">{{ t('subtitles.inFolder') }}</p>
        <ul v-if="tracks.length" class="grid gap-1">
          <li v-for="track in tracks" :key="track.file" class="flex items-center justify-between gap-3 rounded bg-white/5 px-3 py-1.5 text-xs">
            <span class="min-w-0">
              <span class="font-medium text-flixer-text">{{ trackLabel(track) }}</span>
              <span class="ml-2 break-all font-mono text-flixer-muted">{{ track.file }}</span>
            </span>
            <button type="button" class="shrink-0 text-red-300 hover:underline" @click="remove(track)">{{ t('subtitles.remove') }}</button>
          </li>
        </ul>
        <p v-else class="text-xs text-flixer-muted">{{ t('subtitles.none') }}</p>
      </div>

      <p v-if="!configured" class="rounded border border-flixer-border bg-white/5 px-3 py-2 text-xs text-flixer-muted">{{ t('subtitles.notConfigured') }}</p>
      <form v-else class="grid gap-3" @submit.prevent="search">
        <div class="flex flex-wrap items-end gap-2">
          <label class="flex min-w-48 flex-1 flex-col gap-1 text-xs text-flixer-muted">
            {{ t('subtitles.searchLabel') }}
            <input v-model="query" type="text" maxlength="200" :placeholder="t('subtitles.searchPlaceholder')" :class="inputClass" />
          </label>
          <label class="flex flex-col gap-1 text-xs text-flixer-muted">
            {{ t('subtitles.language') }}
            <select v-model="language" :class="inputClass">
              <option v-for="option in languageOptions" :key="option.code" :value="option.code">{{ option.name }}</option>
            </select>
          </label>
          <button type="submit" :disabled="searching" class="h-9 rounded bg-flixer-primary px-4 text-xs font-semibold text-white transition hover:bg-flixer-primary/80 disabled:opacity-50">{{ searching ? t('subtitles.searching') : t('subtitles.search') }}</button>
        </div>

        <p v-if="searchError" role="alert" class="text-xs text-red-300">{{ searchError }}</p>
        <ul v-else-if="results.length" class="grid max-h-72 gap-1 overflow-y-auto pr-1">
          <li v-for="result in results" :key="result.fileId" class="flex items-center justify-between gap-3 rounded bg-white/5 px-3 py-2 text-xs">
            <span class="min-w-0">
              <span class="block break-all font-medium text-flixer-text">{{ result.release || result.fileName }}</span>
              <span class="mt-0.5 flex flex-wrap gap-x-3 text-flixer-muted">
                <span v-if="result.hashMatch" class="font-semibold text-flixer-accent">{{ t('subtitles.exactMatch') }}</span>
                <span v-if="result.hearingImpaired">{{ t('subtitles.hearingImpaired') }}</span>
                <span>{{ t('subtitles.downloads', { count: result.downloads }) }}</span>
                <span v-if="result.uploader">{{ result.uploader }}</span>
              </span>
            </span>
            <button type="button" :disabled="downloading !== null" class="shrink-0 rounded bg-white/10 px-3 py-1 font-semibold transition hover:bg-white/15 disabled:opacity-50" @click="download(result)">{{ downloading === result.fileId ? t('subtitles.downloading') : t('subtitles.download') }}</button>
          </li>
        </ul>
        <p v-else-if="searched && !searching" class="text-xs text-flixer-muted">{{ t('subtitles.noResults') }}</p>
      </form>
    </template>
  </section>
</template>
