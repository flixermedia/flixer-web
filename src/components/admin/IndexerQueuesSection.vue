<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { cancelActiveIndexerTasks, getIndexerStatus, INDEXER_QUEUES, setIndexerConcurrency, setIndexerQueuePaused, type IndexerQueueName, type IndexerQueueStats, type IndexerStatus } from '../../api'
import { notify } from '../../composables/notify'
import { describeRequestError } from '../../composables/useProfile'
import { catchError } from '../../utils/catchError'
import { useLiveTopic } from '../../composables/useLive'
import AdminSection from './AdminSection.vue'
import StatusPill from './StatusPill.vue'
import { confirmAction } from '../../composables/confirm'

const { t } = useI18n()

const status = ref<IndexerStatus | null>(null)
const error = ref('')
const workers = reactive<Partial<Record<IndexerQueueName, number>>>({})
const dirty = ref(false)
const saving = ref(false)
const busyQueue = ref<IndexerQueueName | null>(null)
const cancelling = ref(false)

const anyActive = computed(() => (status.value?.queues ?? []).some((entry) => entry.active + entry.pending > 0))

function statsFor(queue: IndexerQueueName): IndexerQueueStats | undefined {
  return status.value?.queues.find((entry) => entry.queue === queue)
}

function apply(next: IndexerStatus) {
  status.value = next
  error.value = ''
  // Don't overwrite numbers the admin is typing.
  if (!dirty.value) for (const queue of INDEXER_QUEUES) workers[queue] = next.concurrency[queue]
}

async function refresh() {
  const [requestError, result] = await catchError(getIndexerStatus())
  if (requestError) {
    error.value = describeRequestError(requestError, t('admin.indexer.loadError'))
  } else {
    apply(result)
  }
}

async function togglePause(queue: IndexerQueueName) {
  busyQueue.value = queue
  try {
    const [error] = await catchError(setIndexerQueuePaused(queue, !statsFor(queue)?.paused))
    if (error) notify.error(describeRequestError(error, t('admin.indexer.queueError')))
  } finally {
    busyQueue.value = null
  }
}

async function cancelRunning(queues: IndexerQueueName[]) {
  if (!(await confirmAction(t(queues.length > 1 ? 'admin.indexer.cancelAllRunningConfirm' : 'admin.indexer.cancelRunningConfirm'), { danger: true }))) return
  cancelling.value = true
  try {
    let n = 0
    let requestError: Error | undefined
    // A second pass catches work that upstream tasks queued while they were being cancelled.
    for (let pass = 0; pass < (queues.length > 1 ? 2 : 1); pass++) {
      for (const queue of queues) {
        const [error, cancelled] = await catchError(cancelActiveIndexerTasks(queue))
        if (error) {
          requestError = error
          break
        }
        n += cancelled
      }
      if (requestError) break
    }
    if (requestError) {
      notify.error(describeRequestError(requestError, t('admin.indexer.queueError')))
    } else {
      notify.success(t('admin.indexer.cancelledRunning', { n }))
      await refresh()
    }
  } finally {
    cancelling.value = false
  }
}

async function saveWorkers() {
  saving.value = true
  try {
    const counts: Partial<Record<IndexerQueueName, number>> = {}
    for (const queue of INDEXER_QUEUES) if (typeof workers[queue] === 'number') counts[queue] = workers[queue]
    const [error, result] = await catchError(setIndexerConcurrency(counts))
    if (error) {
      notify.error(describeRequestError(error, t('admin.indexer.workersError')))
    } else {
      status.value = result
      dirty.value = false
      notify.success(t('admin.indexer.workersSaved'))
    }
  } finally {
    saving.value = false
  }
}

onMounted(refresh)

const live = useLiveTopic<IndexerStatus>('indexer')
watch(live.data, (value) => {
  if (value) apply(value)
})
</script>

<template>
  <AdminSection :title="t('admin.indexer.queuesTitle')" :description="t('admin.indexer.queuesDescription')">
    <template #actions>
      <button type="button" :disabled="cancelling || !anyActive || !status?.reachable" class="mr-2 rounded bg-red-500/20 px-4 py-1.5 text-xs font-semibold text-red-200 transition hover:bg-red-500/30 disabled:opacity-50" @click="cancelRunning([...INDEXER_QUEUES])">{{ t('admin.indexer.cancelAllRunning') }}</button>
      <button type="button" :disabled="!dirty || saving || !status?.reachable" class="rounded bg-flixer-primary px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-flixer-primary/80 disabled:opacity-50" @click="saveWorkers">{{ t('admin.indexer.saveWorkers') }}</button>
    </template>

    <p v-if="error" role="alert" class="mb-3 text-sm text-red-300">{{ error }}</p>
    <p v-else-if="status && !status.reachable" role="alert" class="mb-3 text-sm text-amber-300">{{ t('admin.indexer.offline') }}</p>

    <div class="overflow-x-auto">
      <table class="w-full min-w-[40rem] text-left text-sm">
        <thead class="text-xs text-flixer-muted">
          <tr>
            <th class="py-2 pr-3 font-medium">{{ t('admin.indexer.queue') }}</th>
            <th class="py-2 pr-3 font-medium">{{ t('admin.indexer.pending') }}</th>
            <th class="py-2 pr-3 font-medium">{{ t('admin.indexer.active') }}</th>
            <th class="py-2 pr-3 font-medium">{{ t('admin.indexer.retry') }}</th>
            <th class="py-2 pr-3 font-medium">{{ t('admin.indexer.failed') }}</th>
            <th class="py-2 pr-3 font-medium">{{ t('admin.indexer.workers') }}</th>
            <th class="py-2 font-medium"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="queue in INDEXER_QUEUES" :key="queue" class="border-t border-flixer-border">
            <td class="py-2 pr-3">
              <span class="font-medium">{{ t(`admin.indexer.queueNames.${queue}`) }}</span>
              <StatusPill :tone="statsFor(queue)?.paused ? 'warn' : 'good'" class="ml-2">{{ statsFor(queue)?.paused ? t('admin.indexer.paused') : t('admin.indexer.running') }}</StatusPill>
            </td>
            <td class="py-2 pr-3 tabular-nums">{{ statsFor(queue)?.pending ?? 0 }}</td>
            <td class="py-2 pr-3 tabular-nums">{{ statsFor(queue)?.active ?? 0 }}</td>
            <td class="py-2 pr-3 tabular-nums">{{ statsFor(queue)?.retry ?? 0 }}</td>
            <td class="py-2 pr-3 tabular-nums" :class="(statsFor(queue)?.archived ?? 0) > 0 ? 'text-red-300' : ''">{{ statsFor(queue)?.archived ?? 0 }}</td>
            <td class="py-2 pr-3">
              <input v-model.number="workers[queue]" type="number" min="1" :max="status?.maxConcurrency ?? 64" :aria-label="`${t('admin.indexer.workers')} ${t(`admin.indexer.queueNames.${queue}`)}`" class="w-20 rounded border border-flixer-border bg-flixer-background px-2 py-1 text-sm text-flixer-text" @input="dirty = true" />
            </td>
            <td class="py-2 text-right">
              <button type="button" :disabled="cancelling || (statsFor(queue)?.active ?? 0) + (statsFor(queue)?.pending ?? 0) === 0 || !status?.reachable" class="mr-2 rounded bg-red-500/20 px-3 py-1 text-xs font-semibold text-red-200 transition hover:bg-red-500/30 disabled:opacity-50" @click="cancelRunning([queue])">{{ t('admin.indexer.cancelRunning') }}</button>
              <button type="button" :disabled="busyQueue === queue || !status?.reachable" class="rounded bg-white/10 px-3 py-1 text-xs font-semibold transition hover:bg-white/15 disabled:opacity-50" @click="togglePause(queue)">{{ statsFor(queue)?.paused ? t('admin.indexer.resume') : t('admin.indexer.pause') }}</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <p v-if="status?.maxConcurrency" class="mt-2 text-xs text-flixer-muted">{{ t('admin.indexer.workersHint', { max: status.maxConcurrency }) }}</p>
  </AdminSection>
</template>
