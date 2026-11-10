<script setup lang="ts">
import { ModalContent, ModalDescription, ModalRoot, ModalTitle, useModalContext } from '@kolirt/vue-modal'
import { useI18n } from 'vue-i18n'
import { useAppearance } from '../../composables/useAppearance'
import { THEME_OPTIONS, useTheme, type ThemePreference } from '../../composables/useTheme'

defineOptions({ modalGroup: 'default' })

const { close } = useModalContext<boolean>()
const { t } = useI18n()
const { preference, setTheme } = useTheme()
const { themes, userSelectionEnabled, userThemeId, activeTheme, selectTheme } = useAppearance()

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
    <ModalContent class="flixer-modal-card flex max-h-[calc(100dvh-2rem)] w-full max-w-md flex-col rounded border border-flixer-border bg-flixer-surface p-6 text-flixer-text shadow-2xl shadow-black/60">
      <header class="flixer-modal-header">
        <ModalTitle class="shrink-0 text-lg font-semibold">{{ t('themeModal.title') }}</ModalTitle>
        <ModalDescription class="mt-1 shrink-0 text-sm leading-6 text-flixer-muted">{{ t('themeModal.description') }}</ModalDescription>
      </header>

      <ul class="mt-5 flex flex-col gap-1" role="radiogroup" :aria-label="t('themeModal.title')">
        <li v-for="option in THEME_OPTIONS" :key="option">
          <button type="button" role="radio" :aria-checked="option === preference" class="flex w-full items-center justify-between gap-3 rounded px-4 py-3 text-left text-sm transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-flixer-accent" :class="option === preference ? 'bg-white/10 font-semibold text-white' : 'text-flixer-text'" @click="select(option)">
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

      <section v-if="userSelectionEnabled && themes.length > 1" class="mt-5 border-t border-flixer-border pt-4">
        <h3 class="text-sm font-semibold">{{ t('themeModal.styleTitle') }}</h3>
        <ul class="mt-2 grid max-h-56 gap-1 overflow-y-auto" role="radiogroup" :aria-label="t('themeModal.styleTitle')">
          <li v-for="theme in themes" :key="theme.id">
            <button type="button" role="radio" :aria-checked="theme.id === activeTheme?.id" class="flex w-full items-center justify-between gap-3 rounded px-4 py-2.5 text-left text-sm transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-flixer-accent" :class="theme.id === activeTheme?.id ? 'bg-white/10 font-semibold text-white' : 'text-flixer-text'" @click="selectTheme(theme.id)">
              <span class="flex min-w-0 items-center gap-3">
                <span class="flex shrink-0 overflow-hidden rounded-full border border-flixer-border" aria-hidden="true">
                  <span class="size-4" :style="{ background: theme.config.colors.dark.background }"></span>
                  <span class="size-4" :style="{ background: theme.config.colors.dark.primary }"></span>
                  <span class="size-4" :style="{ background: theme.config.colors.dark.accent }"></span>
                </span>
                <span class="truncate">{{ theme.name }}</span>
              </span>
              <Icon v-if="theme.id === activeTheme?.id" icon="lucide:check" class="size-4 shrink-0 text-flixer-accent" aria-hidden="true" />
            </button>
          </li>
        </ul>
        <button v-if="userThemeId" type="button" class="mt-2 text-xs text-flixer-muted underline hover:text-white" @click="selectTheme(null)">{{ t('themeModal.styleReset') }}</button>
      </section>

      <div class="flixer-modal-actions mt-5 flex shrink-0 justify-end">
        <button type="button" class="flex h-11 items-center justify-center rounded border border-flixer-border px-6 text-sm font-semibold text-flixer-text transition hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent" @click="close()">{{ t('themeModal.close') }}</button>
      </div>
    </ModalContent>
  </ModalRoot>
</template>
