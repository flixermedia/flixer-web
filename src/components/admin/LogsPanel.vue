<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useLiveLogs, type LiveLogEntry } from '../../composables/useLiveLogs'
import AdminSection from './AdminSection.vue'
import StatusPill from './StatusPill.vue'

const { t } = useI18n()
const { entries, status, paused, pause, resume, clear } = useLiveLogs()

const level = ref<'all' | LiveLogEntry['level']>('all')
const search = ref('')
const listEl = ref<HTMLElement | null>(null)

const levels = ['debug', 'info', 'warn', 'error'] as const
const tone = { debug: 'neutral', info: 'neutral', warn: 'warn', error: 'bad' } as const

const visible = computed(() => {
  const q = search.value.trim().toLowerCase()
  return entries.value.filter(
    (l) =>
      (level.value === 'all' || l.level === level.value) &&
      (!q || l.message.toLowerCase().includes(q) || l.source.toLowerCase().includes(q) || l.app.toLowerCase().includes(q)),
  )
})

const statusTone = computed(() => (status.value === 'live' ? 'accent' : status.value === 'connecting' ? 'neutral' : 'bad'))
const statusLabel = computed(() => (paused.value && status.value === 'live' ? t('admin.logs.paused') : t(`admin.logs.${status.value}`)))

const formatTime = (iso: string) => new Date(iso).toLocaleTimeString()
const formatFields = (fields?: Record<string, unknown>) =>
  Object.entries(fields ?? {})
    .map(([key, value]) => `${key}=${typeof value === 'string' ? value : JSON.stringify(value)}`)
    .join(' ')
const origin = (l: LiveLogEntry) => l.app
const detail = (l: LiveLogEntry) => [l.source && l.source !== l.app ? `source=${l.source}` : '', formatFields(l.fields)].filter(Boolean).join(' ')

watch(
  () => visible.value.length,
  async () => {
    const el = listEl.value
    if (!el) return
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80
    await nextTick()
    if (nearBottom) el.scrollTop = el.scrollHeight
  },
)

function download() {
  const text = visible.value.map((l) => `${l.time} [${l.level.toUpperCase()}] ${origin(l)} ${l.message} ${detail(l)}`.trimEnd()).join('\n')
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `flixer-logs-${new Date().toISOString()}.log`
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <AdminSection :title="t('admin.logs.title')" :description="t('admin.logs.description')">
    <template #actions>
      <StatusPill :tone="statusTone">{{ statusLabel }}</StatusPill>
      <input
        v-model="search"
        type="search"
        :placeholder="t('admin.logs.search')"
        :aria-label="t('admin.logs.search')"
        class="rounded border border-flixer-border bg-flixer-background px-3 py-1.5 text-sm"
      />
      <select v-model="level" :aria-label="t('admin.logs.logLevel')" class="rounded border border-flixer-border bg-flixer-background px-3 py-1.5 text-sm">
        <option value="all">{{ t('admin.logs.all') }}</option>
        <option v-for="l in levels" :key="l" :value="l">{{ t(`admin.logs.${l}`) }}</option>
      </select>
      <button type="button" class="rounded bg-white/10 px-4 py-1.5 text-xs font-semibold transition hover:bg-white/15" @click="paused ? resume() : pause()">
        {{ paused ? t('admin.logs.resume') : t('admin.logs.pause') }}
      </button>
      <button type="button" class="rounded bg-white/10 px-4 py-1.5 text-xs font-semibold transition hover:bg-white/15" @click="clear">{{ t('admin.logs.clear') }}</button>
      <button type="button" class="rounded bg-white/10 px-4 py-1.5 text-xs font-semibold transition hover:bg-white/15" @click="download">{{ t('admin.logs.download') }}</button>
    </template>
    <ul ref="listEl" class="max-h-[32rem] divide-y divide-flixer-border overflow-y-auto font-mono text-xs">
      <li v-for="l in visible" :key="l.id" class="flex flex-wrap items-center gap-3 py-2">
        <span class="text-flixer-muted">{{ formatTime(l.time) }}</span>
        <StatusPill :tone="tone[l.level]">{{ t(`admin.logs.${l.level}`) }}</StatusPill>
        <span class="text-flixer-cyan">{{ origin(l) }}</span>
        <span class="min-w-0 flex-1 whitespace-pre-wrap break-words">
          {{ l.message }}
          <span v-if="detail(l)" class="text-flixer-muted">{{ detail(l) }}</span>
        </span>
      </li>
      <li v-if="visible.length === 0" class="py-6 text-center text-flixer-muted">{{ t('admin.logs.empty') }}</li>
    </ul>
  </AdminSection>
</template>
