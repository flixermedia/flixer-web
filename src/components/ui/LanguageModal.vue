<script setup lang="ts">
import { ModalContent, ModalDescription, ModalRoot, ModalTitle, useModalContext } from '@kolirt/vue-modal'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { availableLocales, localeCountry, localeName, setLocale } from '../../i18n'
import 'flag-icons/css/flag-icons.min.css'

defineOptions({ modalGroup: 'default' })

const { close } = useModalContext<boolean>()
const { t, locale } = useI18n()
const query = ref('')
const options = computed(() => availableLocales.map((code) => ({ code, name: localeName(code), country: localeCountry(code) })))
const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  return q ? options.value.filter((o) => `${o.name} ${o.code}`.toLowerCase().includes(q)) : options.value
})

async function select(code: string) {
  await setLocale(code)
  close()
}
</script>

<template>
  <ModalRoot class="flex items-center justify-center p-4">
    <ModalContent class="flixer-modal-card flex max-h-[calc(100dvh-2rem)] w-full max-w-md flex-col rounded-2xl border border-flixer-border bg-flixer-surface p-6 text-flixer-text shadow-2xl shadow-black/60">
      <ModalTitle class="shrink-0 text-lg font-semibold">{{ t('languageModal.title') }}</ModalTitle>
      <ModalDescription class="mt-1 shrink-0 text-sm leading-6 text-flixer-muted">{{ t('languageModal.description') }}</ModalDescription>

      <input v-model="query" type="search" :placeholder="t('languageModal.search')" :aria-label="t('languageModal.search')" autocomplete="off" class="mt-5 w-full shrink-0 rounded-lg border border-flixer-border bg-flixer-background px-4 py-3 text-sm text-flixer-text placeholder:text-flixer-muted focus-visible:outline-2 focus-visible:outline-flixer-accent" />

      <ul class="mt-3 flex min-h-24 flex-1 flex-col gap-1 overflow-y-auto overscroll-contain pr-1" role="radiogroup" :aria-label="t('languageModal.title')">
        <li v-for="o in filtered" :key="o.code">
          <button type="button" role="radio" :aria-checked="o.code === locale" class="flex w-full items-center justify-between gap-3 rounded-lg px-4 py-3 text-left text-sm transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-flixer-accent" :class="o.code === locale ? 'bg-white/10 font-semibold text-white' : 'text-flixer-text'" @click="select(o.code)">
            <span class="flex min-w-0 items-center gap-3">
              <span v-if="o.country" class="fi shrink-0 rounded-sm" :class="`fi-${o.country}`" aria-hidden="true"></span>
              <Icon v-else icon="lucide:globe" class="size-5 shrink-0" aria-hidden="true" />
              <span class="truncate"
                >{{ o.name }} <span class="text-flixer-muted">({{ o.code }})</span></span
              >
            </span>
            <Icon v-if="o.code === locale" icon="lucide:check" class="size-4 shrink-0 text-flixer-accent" aria-hidden="true" />
          </button>
        </li>
        <li v-if="filtered.length === 0" class="px-4 py-6 text-center text-sm text-flixer-muted">{{ t('languageModal.noResults') }}</li>
      </ul>

      <p class="mt-4 shrink-0 text-xs text-flixer-muted">
        {{ t('languageModal.help') }}
        <a href="https://hosted.weblate.org/projects/flixer/" target="_blank" rel="noopener" class="text-flixer-accent hover:underline">{{ t('settings.language.weblate') }}</a>
      </p>

      <div class="mt-5 flex shrink-0 justify-end">
        <button type="button" class="flex h-11 items-center justify-center rounded-lg border border-flixer-border px-6 text-sm font-semibold text-flixer-text transition hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent" @click="close()">{{ t('languageModal.close') }}</button>
      </div>
    </ModalContent>
  </ModalRoot>
</template>
