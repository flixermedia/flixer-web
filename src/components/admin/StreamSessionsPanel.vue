<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useLiveTopic } from '../../composables/useLive'
import { useI18n } from 'vue-i18n'
import ListSkeleton from '../ui/ListSkeleton.vue'
import { cancelStreamSession, listStreamSessions, type StreamSession, type StreamSessionList } from '../../api'
import { confirmAction } from '../../composables/confirm'
import { notify } from '../../composables/notify'
import { describeRequestError } from '../../composables/useProfile'

const { t } = useI18n()

const data = ref<StreamSessionList | null>(null)
const loadError = ref('')
const cancellingId = ref<string | null>(null)
const expandedId = ref<string | null>(null)
const now = ref(Date.now())
let timer: ReturnType<typeof setInterval> | undefined
let loading = false

const sessions = computed(() => data.value?.sessions ?? [])

const modeKeys: Record<string, string> = {
  DirectPlay: 'admin.streams.directPlay',
  DirectStream: 'admin.streams.remux',
  Transcode: 'admin.streams.transcode',
}

async function load() {
  if (loading) return
  loading = true
  try {
    data.value = await listStreamSessions()
    loadError.value = ''
  } catch (error: unknown) {
    loadError.value = describeRequestError(error, t('admin.streams.loadError'))
  } finally {
    now.value = Date.now()
    loading = false
  }
}

async function cancel(session: StreamSession) {
  const who = session.user?.displayName ?? t('admin.streams.thisViewer')
  if (!(await confirmAction(t('admin.streams.confirmCancel', { file: session.file, name: who }), { danger: true }))) return
  cancellingId.value = session.id
  try {
    await cancelStreamSession(session.id)
    notify.success(t('admin.streams.cancelSuccess'))
  } catch (error: unknown) {
    notify.error(describeRequestError(error, t('admin.streams.cancelError')))
  } finally {
    cancellingId.value = null
    await load()
  }
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`
}

function formatClock(seconds: number) {
  const total = Math.max(0, Math.floor(seconds))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`
}

function elapsed(from: string) {
  return formatClock((now.value - new Date(from).getTime()) / 1000)
}

function quality(session: StreamSession) {
  const target = session.height || session.source.height
  return target ? `${target}p` : t('admin.streams.original')
}

const live = useLiveTopic<StreamSessionList>('streams')
watch(live.data, (value) => {
  if (!value) return
  data.value = value
  loadError.value = ''
  now.value = Date.now()
})

onMounted(() => {
  void load()
  // Only advances the elapsed clock; data arrives over the WebSocket.
  timer = setInterval(() => {
    now.value = Date.now()
  }, 1000)
})

onBeforeUnmount(() => clearInterval(timer))
</script>

<template>
  <section aria-labelledby="streams-heading" class="rounded-lg border border-flixer-border bg-flixer-surface/50 p-5">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 id="streams-heading" class="text-lg font-semibold">{{ t('admin.streams.title') }}</h2>
        <p class="mt-1 text-sm text-flixer-muted">{{ t('admin.streams.description') }}</p>
      </div>
      <p v-if="data" class="rounded bg-white/10 px-3 py-1 text-xs font-semibold" aria-live="polite">{{ data.maxTranscodes > 0 ? t('admin.streams.slotUsage', { active: data.activeTranscodes, max: data.maxTranscodes }) : t('admin.streams.slotUsageUnlimited', { active: data.activeTranscodes }) }}</p>
    </div>

    <p v-if="loadError" class="mt-4 text-sm text-red-300" role="alert">{{ loadError }}</p>
    <ListSkeleton v-else-if="!data" class="mt-4" />
    <p v-else-if="!data.transcodingAvailable" class="mt-4 text-sm text-flixer-muted">{{ t('admin.streams.ffmpegUnavailable') }}</p>
    <p v-else-if="sessions.length === 0" class="mt-4 text-sm text-flixer-muted">{{ t('admin.streams.noSessions') }}</p>

    <ul v-else class="mt-4 flex flex-col gap-3">
      <li v-for="session in sessions" :key="session.id" class="rounded-lg border border-flixer-border bg-flixer-background/60 p-4">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="truncate text-sm font-semibold" :title="session.file">{{ session.file }}</p>
            <p class="mt-1 text-xs text-flixer-muted">
              {{ session.user?.displayName ?? t('admin.streams.unknownUser') }}
              <span v-if="session.user"> ({{ session.user.username }})</span>
              · {{ session.remoteAddr || t('admin.streams.unknownAddress') }}
            </p>
          </div>
          <div class="flex items-center gap-2">
            <span class="rounded px-2.5 py-1 text-xs font-semibold" :class="session.running ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/10 text-flixer-muted'">{{ session.running ? t('admin.streams.encoding') : t('admin.streams.idle') }}</span>
            <button type="button" class="rounded bg-red-500/20 px-4 py-1.5 text-xs font-semibold text-red-200 transition hover:bg-red-500/30 disabled:cursor-wait disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent" :disabled="cancellingId === session.id" @click="cancel(session)">
              {{ cancellingId === session.id ? t('admin.streams.cancelling') : t('admin.streams.cancelStream') }}
            </button>
          </div>
        </div>

        <dl class="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs sm:grid-cols-4">
          <div>
            <dt class="text-flixer-muted">{{ t('admin.streams.method') }}</dt>
            <dd class="font-medium">{{ t(modeKeys[session.mode] ?? session.mode) }} · {{ session.delivery === 'hls' ? t('admin.streams.hls') : t('admin.streams.mp4Webm') }}</dd>
          </div>
          <div>
            <dt class="text-flixer-muted">{{ t('admin.streams.quality') }}</dt>
            <dd class="font-medium">{{ quality(session) }}</dd>
          </div>
          <div>
            <dt class="text-flixer-muted">{{ t('admin.streams.position') }}</dt>
            <dd class="font-medium">{{ formatClock(session.positionSeconds) }} / {{ formatClock(session.source.durationSeconds) }}</dd>
          </div>
          <div>
            <dt class="text-flixer-muted">{{ t('admin.streams.runningFor') }}</dt>
            <dd class="font-medium">{{ elapsed(session.startedAt) }}</dd>
          </div>
          <div>
            <dt class="text-flixer-muted">{{ t('admin.streams.sent') }}</dt>
            <dd class="font-medium">{{ formatBytes(session.bytesSent) }}</dd>
          </div>
          <div>
            <dt class="text-flixer-muted">{{ t('admin.streams.source') }}</dt>
            <dd class="font-medium">{{ session.source.videoCodec }} {{ session.source.width }}×{{ session.source.height }}</dd>
          </div>
        </dl>

        <button type="button" class="mt-3 text-xs text-flixer-muted underline-offset-2 hover:text-flixer-text hover:underline" :aria-expanded="expandedId === session.id" @click="expandedId = expandedId === session.id ? null : session.id">
          {{ expandedId === session.id ? t('admin.streams.hideDetails') : t('admin.streams.showDetails') }}
        </button>
        <dl v-if="expandedId === session.id" class="mt-2 grid gap-2 text-xs">
          <div>
            <dt class="text-flixer-muted">{{ t('admin.streams.sessionId') }}</dt>
            <dd class="break-all font-mono">{{ session.id }}</dd>
          </div>
          <div>
            <dt class="text-flixer-muted">{{ t('admin.streams.ffmpegPid') }}</dt>
            <dd class="font-mono">{{ session.pid ?? t('admin.streams.noPid') }}</dd>
          </div>
          <div>
            <dt class="text-flixer-muted">{{ t('admin.streams.audioCodec') }}</dt>
            <dd>{{ session.source.audioCodec ?? t('admin.streams.none') }}</dd>
          </div>
          <div>
            <dt class="text-flixer-muted">{{ t('admin.streams.lastActivity') }}</dt>
            <dd>{{ new Date(session.lastActivityAt).toLocaleTimeString() }}</dd>
          </div>
          <div>
            <dt class="text-flixer-muted">{{ t('admin.streams.client') }}</dt>
            <dd class="break-all">{{ session.userAgent || t('admin.streams.unknown') }}</dd>
          </div>
        </dl>
      </li>
    </ul>
  </section>
</template>
