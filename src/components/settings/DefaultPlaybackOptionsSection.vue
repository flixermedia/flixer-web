<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { getPreferences, updatePreferences } from '../../api'
import { notify } from '../../composables/notify'
import { languageName } from '../../composables/subtitles'
import { describeRequestError } from '../../composables/useProfile'
import { catchError } from '../../utils/catchError'

const { t, locale } = useI18n()
const autoSkipIntroCredits = ref(true)
const savedAutoSkipIntroCredits = ref(true)
const audioLanguage = ref('')
const savedAudioLanguage = ref('')
const isLoading = ref(true)
const isSaving = ref(false)
const audioLanguages = computed(() => ['ar', 'cs', 'da', 'de', 'el', 'en', 'es', 'fi', 'fr', 'he', 'hi', 'hu', 'id', 'it', 'ja', 'ko', 'ms', 'nl', 'no', 'pl', 'pt', 'pt-BR', 'pt-PT', 'ro', 'ru', 'sv', 'th', 'tr', 'uk', 'vi', 'zh', 'zh-Hans', 'zh-Hant'].map((code) => ({ code, name: languageName(code, locale.value) })).sort((left, right) => left.name.localeCompare(right.name, locale.value)))

async function load() {
  const [error, preferences] = await catchError(getPreferences())
  if (error) {
    console.error('[settings] playback preferences load failed', error)
    notify.error(describeRequestError(error, t('settings.playback.loadFailed')))
    return
  }
  autoSkipIntroCredits.value = preferences.autoSkipIntroCredits ?? true
  savedAutoSkipIntroCredits.value = autoSkipIntroCredits.value
  audioLanguage.value = preferences.audioLanguage ?? ''
  savedAudioLanguage.value = audioLanguage.value
}

async function save() {
  isSaving.value = true
  const [error] = await catchError(updatePreferences({ autoSkipIntroCredits: autoSkipIntroCredits.value }))
  if (error) {
    console.error('[settings] playback preferences update failed', error)
    autoSkipIntroCredits.value = savedAutoSkipIntroCredits.value
    notify.error(describeRequestError(error, t('settings.playback.saveFailed')))
  } else {
    savedAutoSkipIntroCredits.value = autoSkipIntroCredits.value
    notify.success(t('settings.playback.saved'))
  }
  isSaving.value = false
}

async function saveAudioLanguage() {
  isSaving.value = true
  const [error] = await catchError(updatePreferences({ audioLanguage: audioLanguage.value || null }))
  if (error) {
    console.error('[settings] default audio language update failed', error)
    audioLanguage.value = savedAudioLanguage.value
    notify.error(describeRequestError(error, t('settings.playback.saveFailed')))
  } else {
    savedAudioLanguage.value = audioLanguage.value
    notify.success(t('settings.playback.saved'))
  }
  isSaving.value = false
}

onMounted(() => {
  void load().finally(() => {
    isLoading.value = false
  })
})
</script>

<template>
  <section aria-labelledby="default-playback-heading" class="max-w-2xl">
    <h2 id="default-playback-heading" class="text-lg font-semibold">{{ t('settings.playback.title') }}</h2>
    <p class="mt-1 text-sm text-flixer-muted">{{ t('settings.playback.description') }}</p>

    <label class="mt-6 block rounded border border-flixer-border bg-flixer-surface p-4">
      <span class="block text-sm font-medium">{{ t('settings.playback.audioLanguage') }}</span>
      <span class="mt-1 block text-sm text-flixer-muted">{{ t('settings.playback.audioLanguageDescription') }}</span>
      <select v-model="audioLanguage" class="mt-3 w-full rounded border border-flixer-border bg-flixer-background px-3 py-2 text-sm text-flixer-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent" :disabled="isLoading || isSaving" @change="saveAudioLanguage">
        <option value="">{{ t('settings.playback.audioLanguageDefault') }}</option>
        <option v-for="language in audioLanguages" :key="language.code" :value="language.code">{{ language.name }}</option>
      </select>
    </label>

    <label class="mt-6 flex items-start gap-3 rounded border border-flixer-border bg-flixer-surface p-4">
      <input v-model="autoSkipIntroCredits" type="checkbox" class="mt-1 size-4 accent-flixer-primary" :disabled="isLoading || isSaving" @change="save" />
      <span>
        <span class="block text-sm font-medium">{{ t('settings.playback.autoSkipIntroCredits') }}</span>
        <span class="mt-1 block text-sm text-flixer-muted">{{ t('settings.playback.autoSkipIntroCreditsDescription') }}</span>
      </span>
    </label>
  </section>
</template>
