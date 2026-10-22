<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import ListSkeleton from '../ui/ListSkeleton.vue'
import { cancelIndexerTask, clearFailedIndexerTasks, INDEXER_QUEUES, INDEXER_TASK_STATES, listIndexerTasks, retryIndexerTask, type IndexerQueueName, type IndexerTask, type IndexerTaskState } from '../../api'
import { notify } from '../../composables/notify'
import { describeRequestError } from '../../composables/useProfile'
import AdminSection from './AdminSection.vue'

const { t } = useI18n()

const queue = ref<IndexerQueueName>('identify')
const state = ref<IndexerTaskState>('archived')
const page = ref(1)
const tasks = ref<IndexerTask[]>([])
const loading = ref(false)
const error = ref('')
const busyId = ref<string | null>(null)
const clearing = ref(false)

const PAGE_SIZE = 20
const inputClass = 'rounded border border-flixer-border bg-flixer-background px-3 py-1.5 text-sm text-flixer-text'

async function load() {
  loading.value = true
  try {
    tasks.value = await listIndexerTasks(queue.value, state.value, page.value, PAGE_SIZE)
    error.value = ''
  } catch (err: unknown) {
    tasks.value = []
    error.value = describeRequestError(err, t('admin.indexer.tasksError'))
  } finally {
    loading.value = false
  }
}

async function act(task: IndexerTask, action: 'cancel' | 'retry') {
  busyId.value = task.id
  try {
    await (action === 'cancel' ? cancelIndexerTask : retryIndexerTask)(task.queue, task.id)
    await load()
  } catch (err: unknown) {
    notify.error(describeRequestError(err, t('admin.indexer.taskError')))
  } finally {
    busyId.value = null
  }
}

async function clearFailed() {
  if (!window.confirm(t('admin.indexer.clearFailedConfirm'))) return
  clearing.value = true
  try {
    const n = await clearFailedIndexerTasks(queue.value)
    notify.success(t('admin.indexer.clearedFailed', { n }))
    await load()
  } catch (err: unknown) {
    notify.error(describeRequestError(err, t('admin.indexer.taskError')))
  } finally {
    clearing.value = false
  }
}

function canCancel(task: IndexerTask) {
  return task.state === 'pending' || task.state === 'active' || task.state === 'scheduled' || task.state === 'retry'
}

function canRetry(task: IndexerTask) {
  return task.state === 'archived' || task.state === 'scheduled' || task.state === 'retry'
}

function describeTask(task: IndexerTask) {
  return task.path || task.itemType || task.type
}

watch([queue, state], () => {
  page.value = 1
  void load()
}, { immediate: true })
</script>

<template>
  <AdminSection :title="t('admin.indexer.tasksTitle')" :description="t('admin.indexer.tasksDescription')">
    <div class="mb-3 flex flex-wrap gap-3">
      <label class="flex flex-col gap-1 text-xs text-flixer-muted">
        {{ t('admin.indexer.queue') }}
        <select v-model="queue" :class="inputClass">
          <option v-for="name in INDEXER_QUEUES" :key="name" :value="name">{{ t(`admin.indexer.queueNames.${name}`) }}</option>
        </select>
      </label>
      <label class="flex flex-col gap-1 text-xs text-flixer-muted">
        {{ t('admin.indexer.state') }}
        <select v-model="state" :class="inputClass">
          <option v-for="name in INDEXER_TASK_STATES" :key="name" :value="name">{{ t(`admin.indexer.states.${name}`) }}</option>
        </select>
      </label>
      <button v-if="state === 'archived'" type="button" :disabled="clearing || loading || tasks.length === 0" class="self-end rounded bg-red-500/20 px-3 py-1.5 text-sm font-semibold text-red-200 transition hover:bg-red-500/30 disabled:opacity-50" @click="clearFailed">{{ t('admin.indexer.clearFailed') }}</button>
    </div>

    <p v-if="error" role="alert" class="mb-3 text-sm text-red-300">{{ error }}</p>

    <ul class="flex flex-col gap-2">
      <li v-for="task in tasks" :key="task.id" class="rounded-lg border border-flixer-border bg-flixer-background/60 p-3">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="truncate font-mono text-xs">{{ describeTask(task) }}</p>
            <p class="mt-1 text-xs text-flixer-muted">{{ task.type }} · {{ t('admin.indexer.attempts', { n: task.retried + 1, max: task.maxRetry + 1 }) }}</p>
            <p v-if="task.lastError" class="mt-1 break-words text-xs text-red-300">{{ task.lastError }}</p>
          </div>
          <div class="flex gap-2">
            <button v-if="canRetry(task)" type="button" :disabled="busyId === task.id" class="rounded bg-white/10 px-3 py-1 text-xs font-semibold transition hover:bg-white/15 disabled:opacity-50" @click="act(task, 'retry')">{{ t('admin.indexer.retryTask') }}</button>
            <button v-if="canCancel(task)" type="button" :disabled="busyId === task.id" class="rounded bg-red-500/20 px-3 py-1 text-xs font-semibold text-red-200 transition hover:bg-red-500/30 disabled:opacity-50" @click="act(task, 'cancel')">{{ t('admin.indexer.cancelTask') }}</button>
          </div>
        </div>
      </li>
      <li v-if="loading && tasks.length === 0" class="rounded-lg border border-flixer-border p-4"><ListSkeleton :rows="2" /></li>
      <li v-if="!loading && tasks.length === 0 && !error" class="rounded-lg border border-dashed border-flixer-border p-4 text-center text-sm text-flixer-muted">{{ t('admin.indexer.noTasks') }}</li>
    </ul>

    <div v-if="page > 1 || tasks.length === PAGE_SIZE" class="mt-3 flex items-center gap-3 text-xs">
      <button type="button" :disabled="page === 1 || loading" class="rounded bg-white/10 px-3 py-1 font-semibold transition hover:bg-white/15 disabled:opacity-50" @click="page--, load()">{{ t('admin.media.previous') }}</button>
      <button type="button" :disabled="tasks.length < PAGE_SIZE || loading" class="rounded bg-white/10 px-3 py-1 font-semibold transition hover:bg-white/15 disabled:opacity-50" @click="page++, load()">{{ t('admin.media.next') }}</button>
    </div>
  </AdminSection>
</template>
