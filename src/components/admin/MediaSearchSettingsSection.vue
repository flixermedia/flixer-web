<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { getMediaSearchAdminStatus, getMediaSearchTask, rebuildMediaSearchIndex, resetMediaSearchIndex, saveMediaSearchAdminSettings, type MediaSearchAdminStatus, type MediaSearchTaskDetails } from '../../api/admin'
import { confirmAction } from '../../composables/confirm'
import { notify } from '../../composables/notify'
import { describeRequestError } from '../../composables/useProfile'
import { catchError } from '../../utils/catchError'
import AdminSection from './AdminSection.vue'
import AdminSkeleton from './AdminSkeleton.vue'
import AdminToggle from './AdminToggle.vue'
import StatusPill from './StatusPill.vue'

const { t } = useI18n()
const status = ref<MediaSearchAdminStatus | null>(null)
const form = reactive({
  enabled: true,
  customUrl: '',
})
const isLoading = ref(true)
const isSaving = ref(false)
const isRefreshing = ref(false)
const isRebuilding = ref(false)
const isResetting = ref(false)
const selectedTask = ref<MediaSearchTaskDetails | null>(null)
const isLoadingTask = ref(false)
const taskDetailError = ref('')
let taskRefreshTimer: ReturnType<typeof setTimeout> | undefined
let taskDetailTimer: ReturnType<typeof setTimeout> | undefined

const inputClass = 'mt-1 w-full rounded border border-flixer-border bg-flixer-background px-3 py-2 font-mono text-sm text-flixer-text'
const button = 'rounded bg-flixer-primary px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-flixer-primary/80 disabled:opacity-60'
const connectionTone = computed(() => (status.value?.connected === true ? 'good' : status.value?.connected === false ? 'bad' : 'neutral'))
const connectionLabel = computed(() => (status.value?.connected === true ? t('admin.search.connected') : status.value?.connected === false ? t('admin.search.disconnected') : status.value?.enabled ? t('admin.search.notChecked') : t('admin.search.disabled')))

function taskTone(taskStatus: string): 'good' | 'bad' | 'accent' | 'neutral' {
  if (taskStatus === 'succeeded') return 'good'
  if (taskStatus === 'failed' || taskStatus === 'canceled') return 'bad'
  if (taskStatus === 'enqueued' || taskStatus === 'processing') return 'accent'
  return 'neutral'
}

function formatTaskDate(value: string | null): string {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
}

function scheduleTaskRefresh() {
  if (taskRefreshTimer) clearTimeout(taskRefreshTimer)
  if (!status.value?.tasks.some((task) => task.status === 'enqueued' || task.status === 'processing')) return
  taskRefreshTimer = setTimeout(async () => {
    await loadStatus()
  }, 5000)
}

function scheduleTaskDetailRefresh(uid: number) {
  if (taskDetailTimer) clearTimeout(taskDetailTimer)
  if (!selectedTask.value || selectedTask.value.uid !== uid || !['enqueued', 'processing'].includes(selectedTask.value.status)) return
  taskDetailTimer = setTimeout(() => void loadTaskDetails(uid), 2000)
}

async function loadTaskDetails(uid: number) {
  if (selectedTask.value?.uid !== uid) return
  isLoadingTask.value = true
  const [error, result] = await catchError(getMediaSearchTask(uid))
  if (selectedTask.value?.uid !== uid) return
  if (error) {
    console.error(`[admin search] failed to load Meilisearch task ${uid}`, error)
    taskDetailError.value = describeRequestError(error, t('admin.search.taskDetailsError'))
    isLoadingTask.value = false
    return
  }
  selectedTask.value = result
  taskDetailError.value = ''
  isLoadingTask.value = false
  scheduleTaskDetailRefresh(uid)
}

function openTask(task: MediaSearchAdminStatus['tasks'][number]) {
  if (taskDetailTimer) clearTimeout(taskDetailTimer)
  selectedTask.value = { ...task, details: null }
  taskDetailError.value = ''
  void loadTaskDetails(task.uid)
}

function closeTask() {
  if (taskDetailTimer) clearTimeout(taskDetailTimer)
  taskDetailTimer = undefined
  selectedTask.value = null
  taskDetailError.value = ''
}

async function loadStatus(updateForm = false) {
  const [error, result] = await catchError(getMediaSearchAdminStatus())
  if (error) {
    console.error('[admin search] failed to load Meilisearch status', error)
    if (updateForm) notify.error(describeRequestError(error, t('admin.search.loadError')))
  } else {
    status.value = result
    scheduleTaskRefresh()
    if (updateForm) {
      form.enabled = result.enabled
      form.customUrl = result.customUrl
    }
  }
}

async function refresh() {
  isRefreshing.value = true
  try {
    await loadStatus()
  } finally {
    isRefreshing.value = false
  }
}

async function save() {
  isSaving.value = true
  try {
    const [error, result] = await catchError(saveMediaSearchAdminSettings(form))
    if (error) {
      console.error('[admin search] failed to save Meilisearch settings', error)
      notify.error(describeRequestError(error, t('admin.search.saveError')))
    } else {
      status.value = result
      form.enabled = result.enabled
      form.customUrl = result.customUrl
      notify.success(t('admin.search.saved'))
    }
  } finally {
    isSaving.value = false
  }
}

async function rebuild() {
  if (!(await confirmAction(t('admin.search.confirmRebuild')))) return
  isRebuilding.value = true
  try {
    const [error, result] = await catchError(rebuildMediaSearchIndex())
    if (error) {
      console.error('[admin search] failed to queue an index rebuild', error)
      notify.error(describeRequestError(error, t('admin.search.rebuildError')))
    } else {
      notify.success(t(result.queued ? 'admin.search.rebuildQueued' : 'admin.search.rebuildAlreadyQueued'))
      await loadStatus()
    }
  } finally {
    isRebuilding.value = false
  }
}

async function resetAndRebuild() {
  if (!(await confirmAction(t('admin.search.confirmReset')))) return
  isResetting.value = true
  try {
    const [error, result] = await catchError(resetMediaSearchIndex())
    if (error) {
      console.error('[admin search] failed to reset the Meilisearch index', error)
      notify.error(describeRequestError(error, t('admin.search.resetError')))
    } else {
      notify.success(t(result.queued ? 'admin.search.resetQueued' : 'admin.search.resetAlreadyQueued'))
      await loadStatus()
    }
  } finally {
    isResetting.value = false
  }
}

onMounted(async () => {
  try {
    await loadStatus(true)
  } finally {
    isLoading.value = false
  }
})

onBeforeUnmount(() => {
  if (taskRefreshTimer) clearTimeout(taskRefreshTimer)
  if (taskDetailTimer) clearTimeout(taskDetailTimer)
})
</script>

<template>
  <AdminSection :title="t('admin.search.title')" :description="t('admin.search.description')">
    <template #actions>
      <button type="button" class="rounded bg-white/10 px-4 py-1.5 text-xs font-semibold transition hover:bg-white/15 disabled:opacity-60" :disabled="isLoading || isRefreshing" @click="refresh">
        {{ isRefreshing ? t('admin.search.refreshing') : t('admin.search.refresh') }}
      </button>
      <button type="button" :class="button" :disabled="isLoading || isSaving" @click="save">
        {{ isSaving ? t('admin.search.saving') : t('common.save') }}
      </button>
    </template>

    <AdminSkeleton v-if="isLoading" variant="fields" :rows="3" />
    <template v-else>
      <AdminToggle v-model="form.enabled" :label="t('admin.search.enabled')" :description="t('admin.search.enabledHelp')" />

      <label class="mt-4 block text-xs text-flixer-muted">
        {{ t('admin.search.urlLabel') }}
        <input v-model.trim="form.customUrl" type="url" autocomplete="url" spellcheck="false" :placeholder="t('admin.search.urlPlaceholder')" :class="inputClass" />
        <span class="mt-1 block">{{ t('admin.search.urlHelp') }}</span>
      </label>

      <div class="mt-5 rounded-lg border border-flixer-border bg-white/[0.03] p-4">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <h3 class="text-sm font-semibold">{{ t('admin.search.statusTitle') }}</h3>
          <StatusPill :tone="connectionTone">{{ connectionLabel }}</StatusPill>
        </div>
        <p v-if="!status" role="alert" class="mt-3 text-sm text-red-300">{{ t('admin.search.statusUnavailable') }}</p>
        <template v-else>
          <dl class="mt-3 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt class="text-xs text-flixer-muted">{{ t('admin.search.effectiveUrl') }}</dt>
              <dd class="mt-1 break-all font-mono text-xs">{{ status.url }}</dd>
            </div>
            <div>
              <dt class="text-xs text-flixer-muted">{{ t('admin.search.urlSource') }}</dt>
              <dd class="mt-1">{{ t(`admin.search.sources.${status.urlSource}`) }}</dd>
            </div>
            <div>
              <dt class="text-xs text-flixer-muted">{{ t('admin.search.index') }}</dt>
              <dd class="mt-1">{{ status.indexExists === true ? t('admin.search.indexReady') : status.indexExists === false ? t('admin.search.indexMissing') : t('admin.search.notChecked') }}</dd>
            </div>
            <div>
              <dt class="text-xs text-flixer-muted">{{ t('admin.search.documents') }}</dt>
              <dd class="mt-1">{{ status.documentCount ?? '—' }}</dd>
            </div>
            <div>
              <dt class="text-xs text-flixer-muted">{{ t('admin.search.outboxPending') }}</dt>
              <dd class="mt-1">{{ status.outboxPending }}</dd>
            </div>
            <div>
              <dt class="text-xs text-flixer-muted">{{ t('admin.search.outboxFailed') }}</dt>
              <dd class="mt-1">{{ status.outboxFailed }}</dd>
            </div>
            <div>
              <dt class="text-xs text-flixer-muted">{{ t('admin.search.apiKey') }}</dt>
              <dd class="mt-1">{{ status.apiKeyConfigured ? t('admin.search.apiKeyConfigured') : t('admin.search.apiKeyMissing') }}</dd>
            </div>
          </dl>
          <p v-if="status.error" role="alert" class="mt-3 break-words text-sm text-red-300">{{ status.error }}</p>
          <p v-if="status.lastOutboxError" class="mt-3 break-words text-xs text-amber-300">{{ t('admin.search.lastOutboxError') }}: {{ status.lastOutboxError }}</p>
        </template>
      </div>

      <div class="mt-4 rounded-lg border border-flixer-border bg-white/[0.03] p-4">
        <h3 class="text-sm font-semibold">{{ t('admin.search.tasksTitle') }}</h3>
        <p v-if="status?.tasksError" role="alert" class="mt-3 break-words text-sm text-red-300">{{ t('admin.search.tasksError') }}: {{ status.tasksError }}</p>
        <p v-else-if="!status?.tasks.length" class="mt-3 text-sm text-flixer-muted">{{ t('admin.search.noTasks') }}</p>
        <ul v-else class="mt-3 divide-y divide-flixer-border">
          <li v-for="task in status?.tasks ?? []" :key="task.uid" class="py-3 first:pt-0 last:pb-0">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <span class="font-mono text-xs text-flixer-muted">{{ t('admin.search.taskId', { id: task.uid }) }}</span>
              <span class="flex items-center gap-2">
                <StatusPill :tone="taskTone(task.status)">{{ task.status }}</StatusPill>
                <button type="button" class="rounded bg-white/10 px-2.5 py-1 text-xs font-semibold transition hover:bg-white/15" @click="openTask(task)">
                  {{ t('admin.search.viewTask') }}
                </button>
              </span>
            </div>
            <p class="mt-1 text-sm">{{ task.type }}</p>
            <dl class="mt-2 grid gap-2 text-xs sm:grid-cols-3">
              <div>
                <dt class="text-flixer-muted">{{ t('admin.search.taskEnqueued') }}</dt>
                <dd class="mt-0.5">{{ formatTaskDate(task.enqueuedAt) }}</dd>
              </div>
              <div>
                <dt class="text-flixer-muted">{{ t('admin.search.taskStarted') }}</dt>
                <dd class="mt-0.5">{{ formatTaskDate(task.startedAt) }}</dd>
              </div>
              <div>
                <dt class="text-flixer-muted">{{ t('admin.search.taskDuration') }}</dt>
                <dd class="mt-0.5">{{ task.duration ?? '—' }}</dd>
              </div>
            </dl>
            <p v-if="task.error?.message" role="alert" class="mt-2 break-words text-xs text-red-300">{{ task.error.message }}</p>
          </li>
        </ul>
      </div>

      <div class="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p class="text-xs text-flixer-muted">{{ t('admin.search.rebuildHelp') }}</p>
        <div class="flex flex-wrap gap-2">
          <button type="button" class="rounded border border-red-400/40 bg-red-400/10 px-4 py-1.5 text-xs font-semibold text-red-200 transition hover:bg-red-400/20 disabled:opacity-60" :disabled="isRebuilding || isResetting || !form.enabled" @click="resetAndRebuild">
            {{ isResetting ? t('admin.search.resetting') : t('admin.search.reset') }}
          </button>
          <button type="button" class="rounded bg-white/10 px-4 py-1.5 text-xs font-semibold transition hover:bg-white/15 disabled:opacity-60" :disabled="isRebuilding || isResetting || !form.enabled" @click="rebuild">
            {{ isRebuilding ? t('admin.search.rebuilding') : t('admin.search.rebuild') }}
          </button>
        </div>
      </div>
    </template>
  </AdminSection>
  <div v-if="selectedTask" class="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4" @click.self="closeTask" @keydown.esc="closeTask">
    <section class="theme-dark max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-flixer-border bg-flixer-surface p-5 shadow-2xl" role="dialog" aria-modal="true" :aria-label="t('admin.search.taskDetailsTitle', { id: selectedTask.uid })">
      <header class="flex items-start justify-between gap-4">
        <div>
          <h2 class="text-lg font-semibold">{{ t('admin.search.taskDetailsTitle', { id: selectedTask.uid }) }}</h2>
          <div class="mt-2 flex items-center gap-2">
            <StatusPill :tone="taskTone(selectedTask.status)">{{ selectedTask.status }}</StatusPill>
            <span class="text-xs text-flixer-muted">{{ selectedTask.type }}</span>
          </div>
        </div>
        <button type="button" class="rounded bg-white/10 px-3 py-1.5 text-xs font-semibold transition hover:bg-white/15" @click="closeTask">
          {{ t('common.close') }}
        </button>
      </header>
      <p class="mt-4 rounded border border-flixer-border bg-white/[0.03] p-3 text-xs text-flixer-muted">
        {{ t('admin.search.taskDetailsNotice') }}
      </p>
      <p v-if="taskDetailError" role="alert" class="mt-4 break-words text-sm text-red-300">{{ taskDetailError }}</p>
      <p v-else-if="isLoadingTask && !selectedTask.details" class="mt-4 text-sm text-flixer-muted" role="status">{{ t('admin.search.taskDetailsLoading') }}</p>
      <template v-else>
        <dl class="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt class="text-xs text-flixer-muted">{{ t('admin.search.taskEnqueued') }}</dt>
            <dd class="mt-1">{{ formatTaskDate(selectedTask.enqueuedAt) }}</dd>
          </div>
          <div>
            <dt class="text-xs text-flixer-muted">{{ t('admin.search.taskStarted') }}</dt>
            <dd class="mt-1">{{ formatTaskDate(selectedTask.startedAt) }}</dd>
          </div>
          <div>
            <dt class="text-xs text-flixer-muted">{{ t('admin.search.taskFinished') }}</dt>
            <dd class="mt-1">{{ formatTaskDate(selectedTask.finishedAt) }}</dd>
          </div>
          <div>
            <dt class="text-xs text-flixer-muted">{{ t('admin.search.taskDuration') }}</dt>
            <dd class="mt-1">{{ selectedTask.duration ?? '—' }}</dd>
          </div>
        </dl>
        <div v-if="selectedTask.error" class="mt-4 rounded border border-red-400/30 bg-red-400/10 p-3">
          <h3 class="text-sm font-semibold text-red-200">{{ t('admin.search.taskFailure') }}</h3>
          <p class="mt-2 break-words text-xs text-red-200">{{ selectedTask.error.message }}</p>
          <dl v-if="selectedTask.error.code || selectedTask.error.type" class="mt-3 grid gap-2 text-xs sm:grid-cols-2">
            <div v-if="selectedTask.error.code">
              <dt class="text-red-200/70">{{ t('admin.search.taskErrorCode') }}</dt>
              <dd class="mt-0.5 font-mono">{{ selectedTask.error.code }}</dd>
            </div>
            <div v-if="selectedTask.error.type">
              <dt class="text-red-200/70">{{ t('admin.search.taskErrorType') }}</dt>
              <dd class="mt-0.5 font-mono">{{ selectedTask.error.type }}</dd>
            </div>
          </dl>
          <a v-if="selectedTask.error.link" :href="selectedTask.error.link" target="_blank" rel="noopener noreferrer" class="mt-3 inline-block text-xs text-red-200 underline">{{ t('admin.search.taskErrorDocs') }}</a>
        </div>
        <div class="mt-4">
          <div class="flex items-center justify-between gap-3">
            <h3 class="text-sm font-semibold">{{ t('admin.search.taskDetailsData') }}</h3>
            <span v-if="isLoadingTask" class="text-xs text-flixer-muted" role="status">{{ t('admin.search.taskDetailsRefreshing') }}</span>
          </div>
          <pre v-if="selectedTask.details && Object.keys(selectedTask.details).length" class="mt-2 max-h-80 overflow-auto rounded border border-flixer-border bg-black/30 p-3 text-xs text-flixer-text">{{ JSON.stringify(selectedTask.details, null, 2) }}</pre>
          <p v-else class="mt-2 text-xs text-flixer-muted">{{ t('admin.search.taskDetailsEmpty') }}</p>
        </div>
      </template>
    </section>
  </div>
</template>
