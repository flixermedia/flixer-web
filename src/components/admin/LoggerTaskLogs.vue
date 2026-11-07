<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { LoggerClient, type LoggerEvent } from '../../api/logger'
import type { IndexerTaskQueueName } from '../../api'

const props = defineProps<{ queue: IndexerTaskQueueName; id: string }>()
const { t } = useI18n()
const client = new LoggerClient()
const events = ref<LoggerEvent[]>([])
const error = ref('')
const follow = ref(true)
const output = ref<HTMLElement | null>(null)
const capped = ref(false)
const expired = ref(false)
const pending = ref(false)
const now = Date.now()
const start = new Date(now - 30 * 86_400_000).toISOString()
const endTime = now + 86_400_000
const end = new Date(endTime).toISOString()
let cursor: string | undefined
let timer: ReturnType<typeof setTimeout> | undefined
let stopped = false
const seen = new Set<string>()

async function poll() {
  if (stopped || pending.value) return
  if (Date.now() >= endTime) {
    expired.value = true
    return
  }
  pending.value = true
  try {
    const limit = Math.min(200, 1000 - events.value.length)
    const page = await client.search({
      start, end, limit, order: 'oldest', follow: true,
      fields: { app: 'flixer-indexer', task: props.id, task_queue: props.queue },
      ...(cursor ? { cursor } : {}),
    })
    if (stopped) return
    if (!page || typeof page.next_cursor !== 'string' || !Array.isArray(page.events) || page.events.length > limit ||
      (page.events.length > 0 && (!page.next_cursor || page.next_cursor === cursor)) ||
      (page.events.length === 0 && page.next_cursor !== '') ||
      page.events.some((event) => !event || typeof event.event_id !== 'string' || !event.event_id ||
        typeof event.time !== 'string' || typeof event.level !== 'string' || typeof event.message !== 'string' || seen.has(event.event_id))) {
      throw new Error('Invalid logger task page')
    }
    const ids = page.events.map((event) => event.event_id)
    if (new Set(ids).size !== ids.length) throw new Error('Duplicate logger task event')
    for (const id of ids) seen.add(id)
    error.value = ''
    events.value.push(...page.events)
    if (page.next_cursor) cursor = page.next_cursor
    if (page.events.length && follow.value) await nextTick(() => output.value?.scrollTo({ top: output.value.scrollHeight }))
    if (stopped) return
    if (events.value.length >= 1000) capped.value = true
    else timer = setTimeout(poll, 2000)
  } catch {
    if (!stopped) error.value = t('admin.indexer.taskLoggerError')
  } finally {
    pending.value = false
  }
}

function retry() {
  error.value = ''
  void poll()
}

function clock(time: string) {
  const date = new Date(time)
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleTimeString()
}

onMounted(poll)
onBeforeUnmount(() => {
  stopped = true
  if (timer) clearTimeout(timer)
  client.clear()
})
</script>

<template>
  <div class="mt-3 flex shrink-0 items-center justify-between gap-3 text-xs text-flixer-muted">
    <span>{{ t('admin.indexer.taskLoggerWindow') }}</span>
    <label class="flex items-center gap-2"><input v-model="follow" type="checkbox" />{{ t('admin.indexer.taskLogsAutoscroll') }}</label>
  </div>
  <p v-if="error" role="alert" class="mt-2 shrink-0 text-sm text-red-300">
    {{ error }} <button type="button" class="underline" :disabled="pending" @click="retry">{{ t('admin.indexer.taskLoggerRetry') }}</button>
  </p>
  <p v-if="capped" role="status" class="mt-2 text-xs text-flixer-muted">{{ t('admin.indexer.taskLoggerLimit') }}</p>
  <p v-if="expired" role="status" class="mt-2 text-xs text-flixer-muted">{{ t('admin.indexer.taskLoggerExpired') }}</p>
  <div ref="output" class="mt-3 min-h-48 flex-1 overflow-y-auto rounded border border-flixer-border bg-black/40 p-3 font-mono text-xs leading-5">
    <p v-if="events.length === 0 && !error" class="text-flixer-muted">{{ t('admin.indexer.taskLoggerEmpty') }}</p>
    <div v-for="event in events" :key="event.event_id" class="whitespace-pre-wrap break-words" :class="event.level === 'error' || event.level === 'fatal' ? 'text-red-300' : event.level === 'warn' ? 'text-amber-300' : 'text-flixer-text'">
      <span class="text-flixer-muted">{{ clock(event.time) }}</span> {{ event.message }}
      <details v-if="event.fields || event.error" class="ml-4 text-flixer-muted">
        <summary class="cursor-pointer">{{ t('admin.indexer.taskLoggerDetails') }}</summary>
        <pre class="whitespace-pre-wrap break-words">{{ JSON.stringify({ fields: event.fields, error: event.error }, null, 2) }}</pre>
      </details>
    </div>
  </div>
</template>
