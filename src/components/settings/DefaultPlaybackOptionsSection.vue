<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { getPreferences, updatePreferences } from '../../api'
import { notify } from '../../composables/notify'
import { describeRequestError } from '../../composables/useProfile'
import { catchError } from '../../utils/catchError'

const { t } = useI18n()
const autoSkipIntroCredits = ref(true)
const savedAutoSkipIntroCredits = ref(true)
const isLoading = ref(true)
const isSaving = ref(false)

async function load() {
  const [error, preferences] = await catchError(getPreferences())
  if (error) {
    console.error('[settings] playback preferences load failed', error)
    notify.error(describeRequestError(error, t('settings.playback.loadFailed')))
    return
  }
  autoSkipIntroCredits.value = preferences.autoSkipIntroCredits ?? true
  savedAutoSkipIntroCredits.value = autoSkipIntroCredits.value
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

    <label class="mt-6 flex items-start gap-3 rounded-lg border border-flixer-border bg-flixer-surface p-4">
      <input v-model="autoSkipIntroCredits" type="checkbox" class="mt-1 size-4 accent-flixer-primary" :disabled="isLoading || isSaving" @change="save" />
      <span>
        <span class="block text-sm font-medium">{{ t('settings.playback.autoSkipIntroCredits') }}</span>
        <span class="mt-1 block text-sm text-flixer-muted">{{ t('settings.playback.autoSkipIntroCreditsDescription') }}</span>
      </span>
    </label>
  </section>
</template>
