<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Icon } from '@iconify/vue'
import { MAX_SCHEDULES, saveAppearanceSettings, type AppearanceState, type ThemeSchedule } from '../../api'
import { notify } from '../../composables/notify'
import { refreshAppearance } from '../../composables/useAppearance'
import { describeRequestError } from '../../composables/useProfile'
import AdminSection from './AdminSection.vue'
import AdminToggle from './AdminToggle.vue'

const props = defineProps<{ state: AppearanceState }>()
const emit = defineEmits<{ saved: [state: AppearanceState] }>()
const { t } = useI18n()

const rows = ref<ThemeSchedule[]>([])
const saving = ref(false)
const snapshot = computed(() => JSON.stringify(props.state.schedules.map(({ id, ...rest }) => rest)))
const dirty = computed(() => JSON.stringify(rows.value.map(({ id, ...rest }) => rest)) !== snapshot.value)
const effective = computed(() => props.state.themes.find((theme) => theme.id === props.state.effectiveThemeId))
const scheduleActive = computed(() => props.state.effectiveThemeId !== props.state.activeThemeId)
const valid = computed(() => rows.value.every((row) => row.name.trim() && row.themeId && row.start && row.end))

watch(() => props.state.schedules, (schedules) => (rows.value = schedules.map((schedule) => ({ ...schedule }))), { immediate: true })

// The date inputs need a year; 2024 is a leap year so 29 February stays selectable.
const toInput = (monthDay: string) => (monthDay ? `2024-${monthDay}` : '')
const fromInput = (value: string) => value.slice(5)

function add() {
  if (rows.value.length >= MAX_SCHEDULES) return
  rows.value.push({ name: '', themeId: props.state.themes.find((theme) => theme.id !== props.state.activeThemeId)?.id ?? props.state.activeThemeId, start: '12-01', end: '12-31', enabled: true })
}

async function save() {
  if (!valid.value || saving.value) return
  saving.value = true
  try {
    const next = await saveAppearanceSettings({ schedules: rows.value.map((row) => ({ ...row, name: row.name.trim() })) })
    notify.success(t('admin.appearance.schedules.saved'))
    emit('saved', next)
    await refreshAppearance()
  } catch (error) {
    notify.error(describeRequestError(error, t('admin.appearance.schedules.saveError')))
  } finally {
    saving.value = false
  }
}

const field = 'w-full rounded border border-flixer-border bg-flixer-background/60 px-3 py-2 text-sm text-flixer-text outline-none focus:border-flixer-accent'
</script>

<template>
  <AdminSection :title="t('admin.appearance.schedules.title')" :description="t('admin.appearance.schedules.description')">
    <template #actions>
      <button type="button" :disabled="rows.length >= MAX_SCHEDULES" class="flex items-center gap-2 rounded border border-flixer-border px-3 py-2 text-sm font-semibold hover:bg-white/5 disabled:opacity-40" @click="add"><Icon icon="lucide:calendar-plus" class="size-4" />{{ t('admin.appearance.schedules.add') }}</button>
      <button type="button" :disabled="!dirty || !valid || saving" class="rounded bg-flixer-primary px-3 py-2 text-sm font-semibold text-white hover:bg-flixer-primary/80 disabled:cursor-not-allowed disabled:opacity-50" @click="save">{{ saving ? t('admin.appearance.saving') : t('admin.appearance.schedules.save') }}</button>
    </template>
    <p v-if="scheduleActive && effective" class="mb-3 flex items-center gap-2 rounded border border-flixer-accent/30 bg-flixer-accent/10 p-3 text-sm"><Icon icon="lucide:calendar-clock" class="size-4 shrink-0 text-flixer-accent" />{{ t('admin.appearance.schedules.running', { name: effective.name }) }}</p>
    <p v-if="!rows.length" class="rounded border border-dashed border-flixer-border p-6 text-center text-sm text-flixer-muted">{{ t('admin.appearance.schedules.empty') }}</p>
    <ul v-else class="grid gap-3">
      <li v-for="(row, index) in rows" :key="row.id ?? index" class="grid gap-3 rounded border border-flixer-border bg-flixer-background/30 p-3 lg:grid-cols-[1.2fr_1.2fr_auto_auto_auto_auto] lg:items-end">
        <label class="text-xs font-medium text-flixer-muted">{{ t('admin.appearance.schedules.name') }}<input v-model="row.name" maxlength="60" :placeholder="t('admin.appearance.schedules.namePlaceholder')" :class="[field, 'mt-1']" /></label>
        <label class="text-xs font-medium text-flixer-muted">{{ t('admin.appearance.schedules.theme') }}<select v-model="row.themeId" :class="[field, 'mt-1']"><option v-for="theme in state.themes" :key="theme.id" :value="theme.id">{{ theme.name }}</option></select></label>
        <label class="text-xs font-medium text-flixer-muted">{{ t('admin.appearance.schedules.from') }}<input type="date" min="2024-01-01" max="2024-12-31" :value="toInput(row.start)" :class="[field, 'mt-1']" @input="row.start = fromInput(($event.target as HTMLInputElement).value)" /></label>
        <label class="text-xs font-medium text-flixer-muted">{{ t('admin.appearance.schedules.to') }}<input type="date" min="2024-01-01" max="2024-12-31" :value="toInput(row.end)" :class="[field, 'mt-1']" @input="row.end = fromInput(($event.target as HTMLInputElement).value)" /></label>
        <AdminToggle v-model="row.enabled" compact :label="t('admin.appearance.schedules.enabled')" />
        <button type="button" class="rounded p-2 text-flixer-muted hover:bg-white/10 hover:text-white" :aria-label="t('admin.appearance.delete')" @click="rows.splice(index, 1)"><Icon icon="lucide:trash-2" class="size-4" /></button>
      </li>
    </ul>
    <p class="mt-3 text-xs text-flixer-muted">{{ t('admin.appearance.schedules.hint') }}</p>
  </AdminSection>
</template>
