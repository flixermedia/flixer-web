<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { getIndexerStatus, INDEXER_QUEUES, setIndexerConcurrency, setIndexerQueuePaused, type IndexerQueueName, type IndexerQueueStats, type IndexerStatus } from '../../api'
import { notify } from '../../composables/notify'
import { describeRequestError } from '../../composables/useProfile'
import { useLiveTopic } from '../../composables/useLive'
import AdminSection from './AdminSection.vue'
import StatusPill from './StatusPill.vue'

const { t } = useI18n()

const status = ref<IndexerStatus | null>(null)
const error = ref('')
const workers = reactive<Partial<Record<IndexerQueueName, number>>>({})
const dirty = ref(false)
const saving = ref(false)
const busyQueue = ref<IndexerQueueName | null>(null)

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
  try {
    apply(await getIndexerStatus())
  } catch (err: unknown) {
    error.value = describeRequestError(err, t('admin.indexer.loadError'))
  }
}

async function togglePause(queue: IndexerQueueName) {
  busyQueue.value = queue
  try {
    await setIndexerQueuePaused(queue, !statsFor(queue)?.paused)
  } catch (err: unknown) {
    notify.error(describeRequestError(err, t('admin.indexer.queueError')))
  } finally {
    busyQueue.value = null
  }
}

async function saveWorkers() {
  saving.value = true
  try {
    const counts: Partial<Record<IndexerQueueName, number>> = {}
    for (const queue of INDEXER_QUEUES) if (typeof workers[queue] === 'number') counts[queue] = workers[queue]
    status.value = await setIndexerConcurrency(counts)
    dirty.value = false
    notify.success(t('admin.indexer.workersSaved'))
  } catch (err: unknown) {
    notify.error(describeRequestError(err, t('admin.indexer.workersError')))
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
              <button type="button" :disabled="busyQueue === queue || !status?.reachable" class="rounded bg-white/10 px-3 py-1 text-xs font-semibold transition hover:bg-white/15 disabled:opacity-50" @click="togglePause(queue)">{{ statsFor(queue)?.paused ? t('admin.indexer.resume') : t('admin.indexer.pause') }}</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <p v-if="status?.maxConcurrency" class="mt-2 text-xs text-flixer-muted">{{ t('admin.indexer.workersHint', { max: status.maxConcurrency }) }}</p>
  </AdminSection>
</template>
