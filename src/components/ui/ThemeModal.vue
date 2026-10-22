<script setup lang="ts">
import { ModalContent, ModalDescription, ModalRoot, ModalTitle, useModalContext } from '@kolirt/vue-modal'
import { useI18n } from 'vue-i18n'
import { THEME_OPTIONS, useTheme, type ThemePreference } from '../../composables/useTheme'

defineOptions({ modalGroup: 'default' })

const { close } = useModalContext<boolean>()
const { t } = useI18n()
const { preference, setTheme } = useTheme()

const icons: Record<ThemePreference, string> = {
  dark: 'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z',
  light: 'M12 4V2m0 20v-2m8-8h2M2 12h2m13.7-5.7 1.4-1.4M4.9 19.1l1.4-1.4m0-11.4L4.9 4.9m14.2 14.2-1.4-1.4M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0z',
  auto: 'M3 5h18v11H3zM8 20h8m-4-4v4',
}

function select(value: ThemePreference) {
  setTheme(value)
  close()
}
</script>

<template>
  <ModalRoot class="flex items-center justify-center p-4">
    <ModalContent class="flixer-modal-card flex max-h-[calc(100dvh-2rem)] w-full max-w-md flex-col rounded-2xl border border-flixer-border bg-flixer-surface p-6 text-flixer-text shadow-2xl shadow-black/60">
      <ModalTitle class="shrink-0 text-lg font-semibold">{{ t('themeModal.title') }}</ModalTitle>
      <ModalDescription class="mt-1 shrink-0 text-sm leading-6 text-flixer-muted">{{ t('themeModal.description') }}</ModalDescription>

      <ul class="mt-5 flex flex-col gap-1" role="radiogroup" :aria-label="t('themeModal.title')">
        <li v-for="option in THEME_OPTIONS" :key="option">
          <button type="button" role="radio" :aria-checked="option === preference" class="flex w-full items-center justify-between gap-3 rounded-lg px-4 py-3 text-left text-sm transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-flixer-accent" :class="option === preference ? 'bg-white/10 font-semibold text-white' : 'text-flixer-text'" @click="select(option)">
            <span class="flex min-w-0 items-center gap-3">
              <svg class="size-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path :d="icons[option]" /></svg>
              <span class="min-w-0">
                <span class="block truncate">{{ t(`themeModal.${option}`) }}</span>
                <span class="block text-xs font-normal text-flixer-muted">{{ t(`themeModal.${option}Hint`) }}</span>
              </span>
            </span>
            <svg v-if="option === preference" class="size-4 shrink-0 text-flixer-accent" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 10.5l4 4 8-9" /></svg>
          </button>
        </li>
      </ul>

      <div class="mt-5 flex shrink-0 justify-end">
        <button type="button" class="flex h-11 items-center justify-center rounded-lg border border-flixer-border px-6 text-sm font-semibold text-flixer-text transition hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent" @click="close()">{{ t('themeModal.close') }}</button>
      </div>
    </ModalContent>
  </ModalRoot>
</template>
