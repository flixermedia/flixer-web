<script setup lang="ts">
import { computed, ref } from 'vue'
import { ModalContent, ModalDescription, ModalRoot, ModalTitle, useModalContext } from '@kolirt/vue-modal'
import { useI18n } from 'vue-i18n'
import { Icon } from '@iconify/vue'
import { createTheme, previewThemeImport, type AppTheme, type ThemeDraft } from '../../api'
import { describeRequestError } from '../../composables/useProfile'
import { notify } from '../../composables/notify'
import ThemePreview from './ThemePreview.vue'

defineOptions({ modalGroup: 'default' })

const { close, confirm } = useModalContext<AppTheme>()
const { t } = useI18n()
const FILE_MAX_BYTES = 2_000_000

const draft = ref<ThemeDraft | null>(null)
const error = ref('')
const busy = ref(false)
const mode = ref<'dark' | 'light'>('dark')

const flags = computed(() => {
  const config = draft.value?.config
  if (!config) return []
  const result: string[] = []
  if (config.customCss.trim()) result.push('css')
  if (config.branding.logo || config.branding.logoLight || config.branding.favicon) result.push('images')
  if (config.branding.appName) result.push('name')
  return result
})

async function choose(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  error.value = ''
  draft.value = null
  if (file.size > FILE_MAX_BYTES) {
    error.value = t('admin.appearance.import.tooLarge')
    return
  }
  busy.value = true
  try {
    draft.value = await previewThemeImport(await file.text())
  } catch (cause) {
    error.value = describeRequestError(cause, t('admin.appearance.import.invalid'))
  } finally {
    busy.value = false
  }
}

async function importTheme() {
  if (!draft.value || busy.value) return
  busy.value = true
  try {
    const created = await createTheme(draft.value)
    notify.success(t('admin.appearance.import.done', { name: created.name }))
    confirm(created)
  } catch (cause) {
    error.value = describeRequestError(cause, t('admin.appearance.import.failed'))
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <ModalRoot class="flex items-center justify-center p-4">
    <ModalContent class="flixer-modal-card flex max-h-[calc(100dvh-2rem)] w-full max-w-xl flex-col rounded border border-flixer-border bg-flixer-surface p-6 text-flixer-text shadow-2xl shadow-black/60">
      <header class="flixer-modal-header">
        <ModalTitle class="text-lg font-semibold">{{ t('admin.appearance.import.title') }}</ModalTitle>
        <ModalDescription class="mt-1 text-sm leading-6 text-flixer-muted">{{ t('admin.appearance.import.description') }}</ModalDescription>
      </header>
      <div class="mt-5 grid gap-4 overflow-y-auto">
        <label class="grid cursor-pointer place-items-center gap-2 rounded border border-dashed border-flixer-border p-6 text-center text-sm text-flixer-muted hover:bg-white/5">
          <Icon icon="lucide:file-up" class="size-7" />
          <span>{{ busy && !draft ? t('admin.appearance.import.checking') : t('admin.appearance.import.choose') }}</span>
          <input type="file" accept=".json,application/json" class="sr-only" @change="choose" />
        </label>
        <p v-if="error" class="rounded border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300" role="alert">{{ error }}</p>
        <template v-if="draft">
          <div>
            <p class="font-semibold">{{ draft.name }}</p>
            <p v-if="draft.description" class="text-sm text-flixer-muted">{{ draft.description }}</p>
          </div>
          <div class="grid gap-2">
            <div class="flex justify-end rounded">
              <button v-for="m in ['dark', 'light'] as const" :key="m" type="button" class="rounded px-2 py-1 text-xs" :class="mode === m ? 'bg-white/10 text-white' : 'text-flixer-muted'" @click="mode = m">{{ t(`admin.appearance.modes.${m}`) }}</button>
            </div>
            <ThemePreview :config="draft.config" :mode="mode" />
          </div>
          <ul v-if="flags.length" class="grid gap-1 rounded border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
            <li v-for="flag in flags" :key="flag" class="flex gap-2"><Icon icon="lucide:triangle-alert" class="mt-0.5 size-3.5 shrink-0" />{{ t(`admin.appearance.import.flags.${flag}`) }}</li>
          </ul>
          <p class="text-xs text-flixer-muted">{{ t('admin.appearance.import.safe') }}</p>
        </template>
      </div>
      <div class="flixer-modal-actions mt-5 flex justify-end gap-2">
        <button type="button" class="rounded border border-flixer-border px-4 py-2 text-sm font-semibold hover:bg-white/5" @click="close()">{{ t('admin.appearance.cancel') }}</button>
        <button type="button" :disabled="!draft || busy" class="rounded bg-flixer-primary px-4 py-2 text-sm font-semibold text-white hover:bg-flixer-primary/80 disabled:cursor-not-allowed disabled:opacity-50" @click="importTheme">{{ t('admin.appearance.import.confirm') }}</button>
      </div>
    </ModalContent>
  </ModalRoot>
</template>
