<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { openModal } from '@kolirt/vue-modal'
import { useI18n } from 'vue-i18n'
import { Icon } from '@iconify/vue'
import { deleteTheme, duplicateTheme, exportTheme, getAppearanceState, saveAppearanceSettings, type AppearanceState, type AppTheme } from '../../api'
import { confirmAction } from '../../composables/confirm'
import { notify } from '../../composables/notify'
import { refreshAppearance } from '../../composables/useAppearance'
import { describeRequestError } from '../../composables/useProfile'
import AdminSection from './AdminSection.vue'
import AdminToggle from './AdminToggle.vue'
import ThemeEditorModal from './ThemeEditorModal.vue'
import LibraryAccentsSection from './LibraryAccentsSection.vue'
import ThemeImportModal from './ThemeImportModal.vue'
import ThemeSchedulesSection from './ThemeSchedulesSection.vue'
import ThemePreview from './ThemePreview.vue'

const { t } = useI18n()
const state = ref<AppearanceState | null>(null)
const loading = ref(true)
const busy = ref(false)
const previewMode = ref<'dark' | 'light'>('dark')

const themes = computed(() => state.value?.themes ?? [])
const selectable = computed(() => new Set(state.value?.selectableThemeIds ?? []))

async function load() {
  try {
    state.value = await getAppearanceState()
  } catch (error) {
    notify.error(describeRequestError(error, t('admin.appearance.loadError')))
  } finally {
    loading.value = false
  }
}

async function run(action: () => Promise<unknown>, success?: string) {
  if (busy.value) return
  busy.value = true
  try {
    await action()
    if (success) notify.success(success)
    await load()
    await refreshAppearance()
  } catch (error) {
    notify.error(describeRequestError(error, t('admin.appearance.actionError')))
  } finally {
    busy.value = false
  }
}

const apply = (theme: AppTheme) => run(() => saveAppearanceSettings({ activeThemeId: theme.id }), t('admin.appearance.applied', { name: theme.name }))
const duplicate = (theme: AppTheme) => run(() => duplicateTheme(theme.id), t('admin.appearance.duplicated'))
const setUserSelection = (enabled: boolean) => run(() => saveAppearanceSettings({ userSelectionEnabled: enabled }))

function toggleSelectable(theme: AppTheme) {
  const ids = new Set(selectable.value)
  if (ids.has(theme.id)) ids.delete(theme.id)
  else ids.add(theme.id)
  return run(() => saveAppearanceSettings({ selectableThemeIds: [...ids] }))
}

async function remove(theme: AppTheme) {
  if (!(await confirmAction(t('admin.appearance.deleteConfirm', { name: theme.name }), { danger: true, confirmLabel: t('admin.appearance.delete') }))) return
  await run(() => deleteTheme(theme.id), t('admin.appearance.deleted'))
}

async function openEditor(theme?: AppTheme) {
  // A new theme starts from the default theme's configuration.
  const base = themes.value.find((entry) => entry.id === state.value?.activeThemeId) ?? themes.value[0]
  const props = theme ? { theme } : { draft: { name: '', description: '', config: base?.config } }
  const saved = await openModal<AppTheme>(ThemeEditorModal, { group: 'default', props }).catch(() => null)
  if (saved) {
    await load()
    await refreshAppearance()
  }
}

async function openImport() {
  const created = await openModal<AppTheme>(ThemeImportModal, { group: 'default' }).catch(() => null)
  if (created) await load()
}

async function download(theme: AppTheme) {
  try {
    const file = await exportTheme(theme.id)
    const url = URL.createObjectURL(new Blob([JSON.stringify(file, null, 2)], { type: 'application/json' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `${theme.name.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'theme'}.flixertheme.json`
    link.click()
    URL.revokeObjectURL(url)
  } catch (error) {
    notify.error(describeRequestError(error, t('admin.appearance.exportError')))
  }
}

onMounted(load)

const iconButton = 'rounded p-2 text-flixer-muted transition hover:bg-white/10 hover:text-white disabled:opacity-40'
</script>

<template>
  <div class="grid gap-5">
    <AdminSection :title="t('admin.appearance.title')" :description="t('admin.appearance.description')">
      <template #actions>
        <div class="flex rounded bg-black/20 p-1">
          <button v-for="mode in ['dark', 'light'] as const" :key="mode" type="button" class="rounded px-3 py-1.5 text-xs font-semibold" :class="previewMode === mode ? 'bg-white/10 text-white' : 'text-flixer-muted'" @click="previewMode = mode">{{ t(`admin.appearance.modes.${mode}`) }}</button>
        </div>
        <button type="button" class="flex items-center gap-2 rounded border border-flixer-border px-3 py-2 text-sm font-semibold hover:bg-white/5" @click="openImport"><Icon icon="lucide:file-up" class="size-4" />{{ t('admin.appearance.import.button') }}</button>
        <button type="button" class="flex items-center gap-2 rounded bg-flixer-primary px-3 py-2 text-sm font-semibold text-white hover:bg-flixer-primary/80" @click="openEditor()"><Icon icon="lucide:plus" class="size-4" />{{ t('admin.appearance.create') }}</button>
      </template>
      <p v-if="loading" class="text-sm text-flixer-muted">{{ t('admin.appearance.loading') }}</p>
      <div v-else class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <article v-for="theme in themes" :key="theme.id" class="flex flex-col gap-3 rounded border p-3 transition" :class="theme.id === state?.activeThemeId ? 'border-flixer-primary bg-flixer-primary/5' : 'border-flixer-border bg-flixer-background/30'">
          <ThemePreview :config="theme.config" :mode="previewMode" compact />
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-2">
              <h3 class="truncate font-semibold">{{ theme.name }}</h3>
              <span v-if="theme.id === state?.activeThemeId" class="rounded-full bg-flixer-primary px-2 py-0.5 text-[10px] font-semibold uppercase text-white">{{ t('admin.appearance.active') }}</span>
              <span v-if="theme.id === state?.effectiveThemeId && state?.effectiveThemeId !== state?.activeThemeId" class="rounded-full bg-flixer-accent/20 px-2 py-0.5 text-[10px] font-semibold uppercase text-flixer-accent">{{ t('admin.appearance.scheduledNow') }}</span>
              <span v-if="theme.builtIn" class="rounded-full border border-flixer-border px-2 py-0.5 text-[10px] font-semibold uppercase text-flixer-muted">{{ t('admin.appearance.builtIn') }}</span>
            </div>
            <p v-if="theme.description" class="mt-1 text-xs text-flixer-muted">{{ theme.description }}</p>
          </div>
          <AdminToggle v-if="state?.userSelectionEnabled" compact :model-value="selectable.has(theme.id)" :label="t('admin.appearance.allowUsers')" :disabled="busy" @update:model-value="toggleSelectable(theme)" />
          <div class="flex items-center justify-between gap-1">
            <button type="button" :disabled="busy || theme.id === state?.activeThemeId" class="rounded border border-flixer-border px-3 py-1.5 text-xs font-semibold hover:bg-white/5 disabled:opacity-40" @click="apply(theme)">{{ t('admin.appearance.apply') }}</button>
            <div class="flex">
              <button type="button" :class="iconButton" :title="theme.builtIn ? t('admin.appearance.customize') : t('admin.appearance.edit')" :aria-label="theme.builtIn ? t('admin.appearance.customize') : t('admin.appearance.edit')" @click="openEditor(theme)"><Icon :icon="theme.builtIn ? 'lucide:wand-sparkles' : 'lucide:pencil'" class="size-4" /></button>
              <button type="button" :class="iconButton" :disabled="busy" :title="t('admin.appearance.duplicate')" :aria-label="t('admin.appearance.duplicate')" @click="duplicate(theme)"><Icon icon="lucide:copy" class="size-4" /></button>
              <button type="button" :class="iconButton" :title="t('admin.appearance.export')" :aria-label="t('admin.appearance.export')" @click="download(theme)"><Icon icon="lucide:download" class="size-4" /></button>
              <button v-if="!theme.builtIn" type="button" :class="iconButton" :disabled="busy || theme.id === state?.activeThemeId" :title="t('admin.appearance.delete')" :aria-label="t('admin.appearance.delete')" @click="remove(theme)"><Icon icon="lucide:trash-2" class="size-4" /></button>
            </div>
          </div>
        </article>
      </div>
    </AdminSection>

    <AdminSection v-if="state" :title="t('admin.appearance.userChoiceTitle')" :description="t('admin.appearance.userChoiceDescription')">
      <AdminToggle :model-value="state.userSelectionEnabled" :label="t('admin.appearance.userChoiceToggle')" :description="t('admin.appearance.userChoiceHint')" :disabled="busy" @update:model-value="setUserSelection" />
    </AdminSection>

    <ThemeSchedulesSection v-if="state" :state="state" @saved="state = $event" />
    <LibraryAccentsSection v-if="state" :state="state" @saved="state = $event" />
  </div>
</template>
