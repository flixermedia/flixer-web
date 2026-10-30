<script setup lang="ts">
import { ModalContent, ModalDescription, ModalRoot, ModalTitle, useModalContext } from '@kolirt/vue-modal'
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { getIndexerTaskLogs, type IndexerTaskLogEntry, type IndexerTaskQueueName } from '../../api'
import { describeRequestError } from '../../composables/useProfile'
import { catchError } from '../../utils/catchError'

const props = defineProps<{ queue: IndexerTaskQueueName; id: string; title: string }>()

defineOptions({ modalGroup: 'default' })

const { close } = useModalContext<boolean>()
const { t } = useI18n()

const POLL_MS = 2000
const entries = ref<IndexerTaskLogEntry[]>([])
const live = ref(true)
const follow = ref(true)
const error = ref('')
const output = ref<HTMLElement | null>(null)
let timer: ReturnType<typeof setTimeout> | undefined
let stopped = false

async function poll() {
  const [requestError, result] = await catchError(getIndexerTaskLogs(props.queue, props.id, entries.value.length))
  if (requestError) {
    error.value = describeRequestError(requestError, t('admin.indexer.taskLogsError'))
  } else {
    error.value = ''
    if (result.entries.length > 0) {
      entries.value.push(...result.entries)
      if (follow.value) await nextTick(() => output.value?.scrollTo({ top: output.value.scrollHeight }))
    }
    // A task that retries stays "live" so the next attempt's output keeps arriving.
    live.value = result.state === 'active' || result.state === 'pending' || result.state === 'retry' || result.state === 'scheduled'
  }
  if (!stopped && live.value) timer = setTimeout(poll, POLL_MS)
}

function levelClass(level: string) {
  if (level === 'ERROR') return 'text-red-300'
  if (level === 'WARN') return 'text-amber-300'
  if (level === 'DEBUG') return 'text-flixer-muted'
  return 'text-flixer-text'
}

function clock(time: string) {
  const date = new Date(time)
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleTimeString()
}

onMounted(poll)
onBeforeUnmount(() => {
  stopped = true
  if (timer) clearTimeout(timer)
})
</script>

<template>
  <ModalRoot class="flex items-center justify-center p-4">
    <ModalContent class="flixer-modal-card flex max-h-[calc(100dvh-2rem)] w-full max-w-4xl flex-col rounded border border-flixer-border bg-flixer-surface p-6 text-flixer-text shadow-2xl shadow-black/60">
      <ModalTitle class="shrink-0 text-lg font-semibold">{{ t('admin.indexer.taskLogsTitle') }}</ModalTitle>
      <ModalDescription class="mt-1 shrink-0 truncate font-mono text-xs text-flixer-muted">{{ title }}</ModalDescription>
      <div class="mt-3 flex shrink-0 items-center justify-between gap-3 text-xs text-flixer-muted">
        <span :class="live ? 'text-emerald-300' : ''">{{ live ? t('admin.indexer.taskLogsLive') : t('admin.indexer.taskLogsEnded') }}</span>
        <label class="flex items-center gap-2"><input v-model="follow" type="checkbox" />{{ t('admin.indexer.taskLogsAutoscroll') }}</label>
      </div>
      <p v-if="error" role="alert" class="mt-2 shrink-0 text-sm text-red-300">{{ error }}</p>
      <div ref="output" class="mt-3 min-h-48 flex-1 overflow-y-auto rounded border border-flixer-border bg-black/40 p-3 font-mono text-xs leading-5">
        <p v-if="entries.length === 0 && !error" class="text-flixer-muted">{{ t('admin.indexer.taskLogsEmpty') }}</p>
        <p v-for="(entry, index) in entries" :key="index" class="whitespace-pre-wrap break-words" :class="levelClass(entry.level)">
          <span class="text-flixer-muted">{{ clock(entry.time) }}</span> {{ entry.message }}
        </p>
      </div>
      <div class="mt-5 flex shrink-0 justify-end">
        <button type="button" class="rounded bg-white/10 px-4 py-1.5 text-xs font-semibold transition hover:bg-white/15" @click="close()">{{ t('common.close') }}</button>
      </div>
    </ModalContent>
  </ModalRoot>
</template>
