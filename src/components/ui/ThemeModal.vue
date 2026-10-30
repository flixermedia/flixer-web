<script setup lang="ts">
import { ModalContent, ModalDescription, ModalRoot, ModalTitle, useModalContext } from '@kolirt/vue-modal'
import { useI18n } from 'vue-i18n'
import { THEME_OPTIONS, useTheme, type ThemePreference } from '../../composables/useTheme'

defineOptions({ modalGroup: 'default' })

const { close } = useModalContext<boolean>()
const { t } = useI18n()
const { preference, setTheme } = useTheme()

const icons: Record<ThemePreference, string> = {
  dark: 'lucide:moon',
  light: 'lucide:sun',
  auto: 'lucide:monitor',
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
              <Icon :icon="icons[option]" class="size-5 shrink-0" aria-hidden="true" />
              <span class="min-w-0">
                <span class="block truncate">{{ t(`themeModal.${option}`) }}</span>
                <span class="block text-xs font-normal text-flixer-muted">{{ t(`themeModal.${option}Hint`) }}</span>
              </span>
            </span>
            <Icon v-if="option === preference" icon="lucide:check" class="size-4 shrink-0 text-flixer-accent" aria-hidden="true" />
          </button>
        </li>
      </ul>

      <div class="mt-5 flex shrink-0 justify-end">
        <button type="button" class="flex h-11 items-center justify-center rounded-lg border border-flixer-border px-6 text-sm font-semibold text-flixer-text transition hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent" @click="close()">{{ t('themeModal.close') }}</button>
      </div>
    </ModalContent>
  </ModalRoot>
</template>
