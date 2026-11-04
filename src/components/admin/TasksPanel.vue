<script setup lang="ts">
import { onMounted, onUnmounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { listAdminScheduledTasks, runAdminScheduledTask, saveAdminScheduledTaskSchedule, stopAdminScheduledTask, type AdminScheduledTask, type AdminScheduledTaskState } from '../../api'
import { describeRequestError } from '../../composables/useProfile'
import { parseTaskSchedule, taskScheduleCron, type ScheduleFrequency, type TaskScheduleDraft } from './taskSchedule'
import AdminSection from './AdminSection.vue'
import AdminToggle from './AdminToggle.vue'
import StatusPill from './StatusPill.vue'

const { t } = useI18n()
const tasks = ref<AdminScheduledTask[]>([])
const drafts = reactive<Record<string, { enabled: boolean; cron: string }>>({})
const scheduleDrafts = reactive<Record<string, TaskScheduleDraft>>({})
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
const categoryKeys: Record<string, string> = {
  Library: 'admin.tasks.libraryCategory',
  Maintenance: 'admin.tasks.maintenanceCategory',
  Guide: 'admin.tasks.guideCategory',
}

async function loadTasks() {
  if (refreshing.value) return
  refreshing.value = true
  loading.value = true
  try {
    tasks.value = await listAdminScheduledTasks()
    for (const task of tasks.value) {
      if (!dirty.has(task.id)) {
        drafts[task.id] = { enabled: task.enabled, cron: task.cron }
        scheduleDrafts[task.id] = parseTaskSchedule(task.cron)
      }
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

function updateSchedule(task: AdminScheduledTask) {
  drafts[task.id].cron = taskScheduleCron(scheduleDrafts[task.id])
  updateDraft(task)
}

function changeFrequency(task: AdminScheduledTask, frequency: ScheduleFrequency) {
  const schedule = scheduleDrafts[task.id]
  schedule.customCron = taskScheduleCron(schedule)
  schedule.frequency = frequency
  updateSchedule(task)
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
      <li v-for="task in tasks" :key="task.id" class="rounded border border-flixer-border bg-flixer-background/60 p-4 transition-colors hover:border-flixer-accent/30 sm:p-5">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-x-3 gap-y-2">
              <h3 class="text-sm font-semibold tracking-tight sm:text-base">{{ task.name }}</h3>
              <StatusPill tone="accent">{{ categoryKeys[task.category] ? t(categoryKeys[task.category]) : task.category }}</StatusPill>
            </div>
            <p class="mt-1.5 max-w-2xl text-sm leading-5 text-flixer-muted">{{ task.description }}</p>
          </div>
          <div class="flex shrink-0 items-center gap-2 self-start">
            <StatusPill :tone="stateTone[task.state]">
              {{ task.state === 'running' && task.progress !== undefined ? t('admin.tasks.running', { progress: task.progress }) : t(stateKeys[task.state]) }}
            </StatusPill>
            <button v-if="task.state === 'running' || task.state === 'queued'" type="button" :disabled="busyId === task.id" class="inline-flex h-9 items-center justify-center rounded bg-red-500/15 px-4 text-xs font-semibold text-red-200 transition hover:bg-red-500/25 disabled:opacity-50" @click="stopTask(task)">{{ t('admin.tasks.stop') }}</button>
            <button v-else type="button" :disabled="busyId === task.id" class="inline-flex h-9 items-center justify-center rounded bg-white/10 px-4 text-xs font-semibold transition hover:bg-white/15 disabled:opacity-50" @click="runTask(task)">{{ t('admin.tasks.runNow') }}</button>
          </div>
        </div>
        <div v-if="task.state === 'running' && task.progress !== undefined" class="mt-3 h-1.5 overflow-hidden rounded bg-white/10">
          <div class="h-full rounded bg-flixer-primary" :style="{ width: `${task.progress}%` }"></div>
        </div>
        <div class="mt-3 flex flex-wrap items-center gap-2">
          <select :value="scheduleDrafts[task.id].frequency" :aria-label="t('admin.tasks.frequency')" class="h-9 rounded border border-flixer-border bg-flixer-background px-2 text-sm text-flixer-text focus-visible:outline-2 focus-visible:outline-flixer-accent" @change="changeFrequency(task, ($event.target as HTMLSelectElement).value as ScheduleFrequency)">
            <option value="hourly">{{ t('admin.tasks.hourly') }}</option>
            <option value="daily">{{ t('admin.tasks.daily') }}</option>
            <option value="weekly">{{ t('admin.tasks.weekly') }}</option>
            <option value="monthly">{{ t('admin.tasks.monthly') }}</option>
            <option value="custom">{{ t('admin.tasks.custom') }}</option>
          </select>
          <select v-if="scheduleDrafts[task.id].frequency === 'hourly'" v-model.number="scheduleDrafts[task.id].intervalHours" :aria-label="t('admin.tasks.everyHours')" class="h-9 rounded border border-flixer-border bg-flixer-background px-2 text-sm text-flixer-text focus-visible:outline-2 focus-visible:outline-flixer-accent" @change="updateSchedule(task)">
            <option v-for="hours in [1, 2, 3, 4, 6, 8, 12]" :key="hours" :value="hours">{{ t('admin.tasks.everyNHours', { count: hours }) }}</option>
          </select>
          <select v-if="scheduleDrafts[task.id].frequency === 'weekly'" v-model.number="scheduleDrafts[task.id].dayOfWeek" :aria-label="t('admin.tasks.dayOfWeek')" class="h-9 rounded border border-flixer-border bg-flixer-background px-2 text-sm text-flixer-text focus-visible:outline-2 focus-visible:outline-flixer-accent" @change="updateSchedule(task)">
            <option v-for="day in 7" :key="day - 1" :value="day - 1">{{ new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(new Date(Date.UTC(2024, 0, day + 6))) }}</option>
          </select>
          <select v-if="scheduleDrafts[task.id].frequency === 'monthly'" v-model.number="scheduleDrafts[task.id].dayOfMonth" :aria-label="t('admin.tasks.dayOfMonth')" class="h-9 rounded border border-flixer-border bg-flixer-background px-2 text-sm text-flixer-text focus-visible:outline-2 focus-visible:outline-flixer-accent" @change="updateSchedule(task)">
            <option v-for="day in 31" :key="day" :value="day">{{ day }}</option>
          </select>
          <input v-if="scheduleDrafts[task.id].frequency !== 'hourly' && scheduleDrafts[task.id].frequency !== 'custom'" v-model="scheduleDrafts[task.id].time" type="time" :aria-label="t('admin.tasks.timeUtc')" :title="t('admin.tasks.timeUtc')" class="h-9 rounded border border-flixer-border bg-flixer-background px-2 text-sm text-flixer-text focus-visible:outline-2 focus-visible:outline-flixer-accent" @input="updateSchedule(task)" />
          <input v-if="scheduleDrafts[task.id].frequency === 'custom'" v-model="scheduleDrafts[task.id].customCron" type="text" maxlength="128" :aria-label="t('admin.tasks.cron')" :title="t('admin.tasks.cronHint')" class="h-9 w-40 rounded border border-flixer-border bg-flixer-background px-2 font-mono text-sm text-flixer-text focus-visible:outline-2 focus-visible:outline-flixer-accent" @input="updateSchedule(task)" />
          <span class="text-xs text-flixer-muted">UTC</span>
          <button type="button" :disabled="!isDirty(task) || savingId === task.id" class="inline-flex h-9 items-center justify-center rounded bg-white/10 px-3 text-xs font-semibold transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50" @click="saveSchedule(task)">{{ savingId === task.id ? t('admin.tasks.saving') : t('admin.tasks.saveSchedule') }}</button>
          <AdminToggle v-model="drafts[task.id].enabled" :label="t('admin.tasks.enabled')" compact class="ml-auto shrink-0" @update:model-value="updateDraft(task)" />
        </div>
        <div class="mt-2 text-xs">
          <p class="text-flixer-muted">
            {{ t('admin.tasks.lastRun') }} <span class="ml-1 font-medium text-flixer-text">{{ formatLastRun(task.lastRunAt) }}</span>
          </p>
          <p v-if="task.lastError" role="status" class="mt-1 break-words text-red-200">{{ t('admin.tasks.lastError') }}: {{ task.lastError }}</p>
        </div>
      </li>
      <li v-if="loading && tasks.length === 0" class="rounded border border-flixer-border bg-flixer-background/60 p-5 text-sm text-flixer-muted">{{ t('admin.tasks.loading') }}</li>
      <li v-else-if="!loading && tasks.length === 0 && !loadError" class="rounded border border-dashed border-flixer-border p-8 text-center text-sm text-flixer-muted">{{ t('admin.tasks.empty') }}</li>
    </ul>
  </AdminSection>
</template>
