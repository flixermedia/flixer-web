<script setup lang="ts">
import { onMounted, onUnmounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { listAdminScheduledTasks, runAdminScheduledTask, saveAdminScheduledTaskSchedule, stopAdminScheduledTask, type AdminScheduledTask, type AdminScheduledTaskState } from '../../api'
import { describeRequestError } from '../../composables/useProfile'
import AdminSection from './AdminSection.vue'
import AdminToggle from './AdminToggle.vue'
import StatusPill from './StatusPill.vue'

const { t } = useI18n()
const tasks = ref<AdminScheduledTask[]>([])
const drafts = reactive<Record<string, { enabled: boolean; cron: string }>>({})
const dirty = new Set<string>()
const loading = ref(true)
const refreshing = ref(false)
const loadError = ref('')
const actionError = ref('')
const busyId = ref<string | null>(null)
const savingId = ref<string | null>(null)
let refreshTimer: ReturnType<typeof setInterval> | undefined

const stateTone: Record<AdminScheduledTaskState, 'good' | 'accent' | 'bad' | 'neutral'> = {
  running: 'good',
  queued: 'accent',
  completed: 'good',
  failed: 'bad',
  cancelled: 'neutral',
  never: 'neutral',
}
const stateKeys: Record<AdminScheduledTaskState, string> = {
  running: 'admin.tasks.runningIndeterminate',
  queued: 'admin.tasks.queued',
  completed: 'admin.tasks.completed',
  failed: 'admin.tasks.failed',
  cancelled: 'admin.tasks.cancelled',
  never: 'admin.tasks.neverRun',
}
const categoryKeys: Record<string, string> = { Library: 'admin.tasks.libraryCategory', Maintenance: 'admin.tasks.maintenanceCategory' }

async function loadTasks() {
  if (refreshing.value) return
  refreshing.value = true
  loading.value = true
  try {
    tasks.value = await listAdminScheduledTasks()
    for (const task of tasks.value) {
      if (!dirty.has(task.id)) drafts[task.id] = { enabled: task.enabled, cron: task.cron }
    }
    loadError.value = ''
  } catch (error) {
    loadError.value = describeRequestError(error, t('admin.tasks.loadFailed'))
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

function isDirty(task: AdminScheduledTask) {
  const draft = drafts[task.id]
  return !!draft && (draft.enabled !== task.enabled || draft.cron !== task.cron)
}

function updateDraft(task: AdminScheduledTask) {
  dirty.add(task.id)
}

async function saveSchedule(task: AdminScheduledTask) {
  const draft = drafts[task.id]
  if (!draft || !isDirty(task)) return
  const changes = { enabled: draft.enabled, cron: draft.cron }
  savingId.value = task.id
  actionError.value = ''
  try {
    await saveAdminScheduledTaskSchedule(task.id, changes)
    if (draft.enabled === changes.enabled && draft.cron === changes.cron) dirty.delete(task.id)
    task.enabled = changes.enabled
    task.cron = changes.cron
    void loadTasks()
  } catch (error) {
    actionError.value = describeRequestError(error, t('admin.tasks.scheduleFailed'))
  } finally {
    savingId.value = null
  }
}

async function runTask(task: AdminScheduledTask) {
  busyId.value = task.id
  actionError.value = ''
  try {
    await runAdminScheduledTask(task.id)
    await loadTasks()
  } catch (error) {
    actionError.value = describeRequestError(error, t('admin.tasks.runFailed'))
  } finally {
    busyId.value = null
  }
}

async function stopTask(task: AdminScheduledTask) {
  busyId.value = task.id
  actionError.value = ''
  try {
    await stopAdminScheduledTask(task.id)
    await loadTasks()
  } catch (error) {
    actionError.value = describeRequestError(error, t('admin.tasks.stopFailed'))
  } finally {
    busyId.value = null
  }
}

function formatLastRun(value: string | null) {
  if (!value) return t('admin.tasks.neverRun')
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
}

onMounted(() => {
  void loadTasks()
  refreshTimer = setInterval(() => void loadTasks(), 5_000)
})

onUnmounted(() => {
  if (refreshTimer) clearInterval(refreshTimer)
})
</script>

<template>
  <AdminSection :title="t('admin.tasks.title')" :description="t('admin.tasks.description')">
    <p v-if="loadError" role="alert" class="mb-3 rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{{ loadError }}</p>
    <p v-if="actionError" role="alert" class="mb-3 rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{{ actionError }}</p>
    <ul class="flex flex-col gap-4">
      <li v-for="task in tasks" :key="task.id" class="rounded-xl border border-flixer-border bg-flixer-background/60 p-4 transition-colors hover:border-flixer-accent/30 sm:p-5">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-x-3 gap-y-2">
              <h3 class="text-sm font-semibold tracking-tight sm:text-base">{{ task.name }}</h3>
              <StatusPill tone="accent">{{ t(categoryKeys[task.category]) }}</StatusPill>
            </div>
            <p class="mt-1.5 max-w-2xl text-sm leading-5 text-flixer-muted">{{ task.description }}</p>
          </div>
          <div class="flex shrink-0 items-center gap-2 self-start">
            <StatusPill :tone="stateTone[task.state]">
              {{ task.state === 'running' && task.progress !== undefined ? t('admin.tasks.running', { progress: task.progress }) : t(stateKeys[task.state]) }}
            </StatusPill>
            <button v-if="task.state === 'running' || task.state === 'queued'" type="button" :disabled="busyId === task.id" class="inline-flex h-9 items-center justify-center rounded-lg bg-red-500/15 px-4 text-xs font-semibold text-red-200 transition hover:bg-red-500/25 disabled:opacity-50" @click="stopTask(task)">{{ t('admin.tasks.stop') }}</button>
            <button v-else type="button" :disabled="busyId === task.id" class="inline-flex h-9 items-center justify-center rounded-lg bg-white/10 px-4 text-xs font-semibold transition hover:bg-white/15 disabled:opacity-50" @click="runTask(task)">{{ t('admin.tasks.runNow') }}</button>
          </div>
        </div>
        <div v-if="task.state === 'running' && task.progress !== undefined" class="mt-3 h-1.5 overflow-hidden rounded bg-white/10">
          <div class="h-full rounded bg-flixer-primary" :style="{ width: `${task.progress}%` }"></div>
        </div>
        <div class="mt-5 grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
          <div class="min-w-0">
            <input v-model="drafts[task.id].cron" type="text" maxlength="128" :aria-label="`${task.name} ${t('admin.tasks.cron')}`" class="h-10 w-full rounded-lg border border-flixer-border bg-flixer-background px-3 font-mono text-sm text-flixer-text focus-visible:outline-2 focus-visible:outline-flixer-accent" @input="updateDraft(task)" />
          </div>
          <button type="button" :disabled="!isDirty(task) || savingId === task.id" class="inline-flex h-10 w-full items-center justify-center rounded-lg bg-white/10 px-4 text-sm font-semibold transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto" @click="saveSchedule(task)">{{ savingId === task.id ? t('admin.tasks.saving') : t('admin.tasks.saveSchedule') }}</button>
        </div>
        <div class="mt-4 flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
          <div class="min-w-0 flex-1 text-xs">
            <p class="text-flixer-muted">
              {{ t('admin.tasks.lastRun') }} <span class="ml-1 font-medium text-flixer-text">{{ formatLastRun(task.lastRunAt) }}</span>
            </p>
            <p v-if="task.lastError" role="status" class="mt-2 break-words text-red-200">{{ t('admin.tasks.lastError') }}: {{ task.lastError }}</p>
          </div>
          <AdminToggle v-model="drafts[task.id].enabled" :label="t('admin.tasks.enabled')" compact class="shrink-0" @update:model-value="updateDraft(task)" />
        </div>
      </li>
      <li v-if="loading && tasks.length === 0" class="rounded-xl border border-flixer-border bg-flixer-background/60 p-5 text-sm text-flixer-muted">{{ t('admin.tasks.loading') }}</li>
      <li v-else-if="!loading && tasks.length === 0 && !loadError" class="rounded-xl border border-dashed border-flixer-border p-8 text-center text-sm text-flixer-muted">{{ t('admin.tasks.empty') }}</li>
    </ul>
  </AdminSection>
</template>
