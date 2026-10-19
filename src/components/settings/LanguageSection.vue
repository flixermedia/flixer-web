<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { availableLocales, localeName, setLocale } from '../../i18n'

const { t, locale } = useI18n()
const options = computed(() => availableLocales.map((code) => ({ code, name: localeName(code) })))
const selected = computed({
  get: () => locale.value,
  set: (code: string) => void setLocale(code),
})
</script>

<template>
  <section aria-labelledby="language-heading" class="max-w-xl">
    <h2 id="language-heading" class="text-lg font-semibold">{{ t('settings.language.title') }}</h2>
    <p class="mt-1 text-sm text-flixer-muted">{{ t('settings.language.description') }}</p>
    <label class="mt-6 block text-sm font-medium">
      {{ t('settings.language.label') }}
      <select v-model="selected" class="mt-2 w-full rounded-lg border border-flixer-border bg-flixer-surface px-3 py-3 text-sm focus-visible:outline-2 focus-visible:outline-flixer-accent">
        <option v-for="o in options" :key="o.code" :value="o.code">{{ o.name }} ({{ o.code }})</option>
      </select>
    </label>
    <p class="mt-3 text-xs text-flixer-muted">
      {{ t('settings.language.help') }}
      <a href="https://hosted.weblate.org/projects/flixer/" target="_blank" rel="noopener" class="text-flixer-accent hover:underline">{{ t('settings.language.weblate') }}</a>
    </p>
  </section>
</template>
