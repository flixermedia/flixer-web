<script setup lang="ts">
import { ModalContent, ModalDescription, ModalRoot, ModalTitle, useModalContext } from '@kolirt/vue-modal'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { availableLocales, localeName, setLocale } from '../../i18n'

defineOptions({ modalGroup: 'default' })

const { close } = useModalContext<boolean>()
const { t, locale } = useI18n()
const options = computed(() => availableLocales.map((code) => ({ code, name: localeName(code) })))

async function select(code: string) {
  await setLocale(code)
  close()
}
</script>

<template>
  <ModalRoot class="flex items-center justify-center p-4">
    <ModalContent class="flixer-modal-card w-full max-w-md rounded-2xl border border-flixer-border bg-flixer-surface p-6 text-flixer-text shadow-2xl shadow-black/60">
      <ModalTitle class="text-lg font-semibold">{{ t('languageModal.title') }}</ModalTitle>
      <ModalDescription class="mt-1 text-sm leading-6 text-flixer-muted">{{ t('languageModal.description') }}</ModalDescription>

      <ul class="mt-5 flex max-h-80 flex-col gap-1 overflow-y-auto" role="radiogroup" :aria-label="t('languageModal.title')">
        <li v-for="o in options" :key="o.code">
          <button type="button" role="radio" :aria-checked="o.code === locale" class="flex w-full items-center justify-between rounded-lg px-4 py-3 text-left text-sm transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-flixer-accent" :class="o.code === locale ? 'bg-white/10 font-semibold text-white' : 'text-flixer-text'" @click="select(o.code)">
            <span
              >{{ o.name }} <span class="text-flixer-muted">({{ o.code }})</span></span
            >
            <svg v-if="o.code === locale" class="size-4 text-flixer-accent" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 10.5l4 4 8-9" /></svg>
          </button>
        </li>
      </ul>

      <p class="mt-4 text-xs text-flixer-muted">
        {{ t('languageModal.help') }}
        <a href="https://hosted.weblate.org/projects/flixer/" target="_blank" rel="noopener" class="text-flixer-accent hover:underline">{{ t('settings.language.weblate') }}</a>
      </p>

      <div class="mt-5 flex justify-end">
        <button type="button" class="flex h-11 items-center justify-center rounded-lg border border-flixer-border px-6 text-sm font-semibold text-flixer-text transition hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent" @click="close()">{{ t('languageModal.close') }}</button>
      </div>
    </ModalContent>
  </ModalRoot>
</template>
