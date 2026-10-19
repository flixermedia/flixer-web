<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { cancelStreamSession, listStreamSessions, type StreamSession, type StreamSessionList } from '../../api'
import { notify } from '../../composables/notify'
import { describeRequestError } from '../../composables/useProfile'

const REFRESH_MS = 3000

const data = ref<StreamSessionList | null>(null)
const loadError = ref('')
const cancellingId = ref<string | null>(null)
const expandedId = ref<string | null>(null)
const now = ref(Date.now())
let timer: ReturnType<typeof setInterval> | undefined
let loading = false

const sessions = computed(() => data.value?.sessions ?? [])

const MODE_LABELS: Record<string, string> = {
  DirectPlay: 'Direct play',
  DirectStream: 'Remux',
  Transcode: 'Transcode',
}

async function load() {
  if (loading) return
  loading = true
  try {
    data.value = await listStreamSessions()
    loadError.value = ''
  } catch (error: unknown) {
    loadError.value = describeRequestError(error, 'We couldn’t reach the streamer.')
  } finally {
    now.value = Date.now()
    loading = false
  }
}

async function cancel(session: StreamSession) {
  const who = session.user?.displayName ?? 'this viewer'
  if (!window.confirm(`Stop ${session.file} for ${who}? Their player will show an error.`)) return
  cancellingId.value = session.id
  try {
    await cancelStreamSession(session.id)
    notify.success('Stream cancelled.')
  } catch (error: unknown) {
    notify.error(describeRequestError(error, 'We couldn’t cancel that stream.'))
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
  return target ? `${target}p` : 'Original'
}

onMounted(() => {
  void load()
  timer = setInterval(() => {
    now.value = Date.now()
    void load()
  }, REFRESH_MS)
})

onBeforeUnmount(() => clearInterval(timer))
</script>

<template>
  <section aria-labelledby="streams-heading" class="rounded-lg border border-flixer-border bg-flixer-surface/50 p-5">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 id="streams-heading" class="text-lg font-semibold">Active streams</h2>
        <p class="mt-1 text-sm text-flixer-muted">Playback sessions the streamer is remuxing or transcoding right now.</p>
      </div>
      <p v-if="data" class="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold" aria-live="polite">{{ data.activeTranscodes }} / {{ data.maxTranscodes }} slots in use</p>
    </div>

    <p v-if="loadError" class="mt-4 text-sm text-red-300" role="alert">{{ loadError }}</p>
    <p v-else-if="!data" class="mt-4 text-sm text-flixer-muted">Loading streams…</p>
    <p v-else-if="!data.transcodingAvailable" class="mt-4 text-sm text-flixer-muted">ffmpeg is not available on the streamer, so only direct play is possible.</p>
    <p v-else-if="sessions.length === 0" class="mt-4 text-sm text-flixer-muted">No active transcode or remux sessions.</p>

    <ul v-else class="mt-4 flex flex-col gap-3">
      <li v-for="session in sessions" :key="session.id" class="rounded-lg border border-flixer-border bg-flixer-background/60 p-4">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="truncate text-sm font-semibold" :title="session.file">{{ session.file }}</p>
            <p class="mt-1 text-xs text-flixer-muted">
              {{ session.user?.displayName ?? 'Unknown user' }}
              <span v-if="session.user"> (@{{ session.user.username }})</span>
              · {{ session.remoteAddr || 'unknown address' }}
            </p>
          </div>
          <div class="flex items-center gap-2">
            <span class="rounded-full px-2.5 py-1 text-xs font-semibold" :class="session.running ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/10 text-flixer-muted'">{{ session.running ? 'Encoding' : 'Idle' }}</span>
            <button type="button" class="rounded-full bg-red-500/20 px-4 py-1.5 text-xs font-semibold text-red-200 transition hover:bg-red-500/30 disabled:cursor-wait disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent" :disabled="cancellingId === session.id" @click="cancel(session)">
              {{ cancellingId === session.id ? 'Cancelling…' : 'Cancel stream' }}
            </button>
          </div>
        </div>

        <dl class="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs sm:grid-cols-4">
          <div><dt class="text-flixer-muted">Method</dt><dd class="font-medium">{{ MODE_LABELS[session.mode] ?? session.mode }} · {{ session.delivery === 'hls' ? 'HLS' : 'MP4/WebM' }}</dd></div>
          <div><dt class="text-flixer-muted">Quality</dt><dd class="font-medium">{{ quality(session) }}</dd></div>
          <div><dt class="text-flixer-muted">Position</dt><dd class="font-medium">{{ formatClock(session.positionSeconds) }} / {{ formatClock(session.source.durationSeconds) }}</dd></div>
          <div><dt class="text-flixer-muted">Running for</dt><dd class="font-medium">{{ elapsed(session.startedAt) }}</dd></div>
          <div><dt class="text-flixer-muted">Sent</dt><dd class="font-medium">{{ formatBytes(session.bytesSent) }}</dd></div>
          <div><dt class="text-flixer-muted">Source</dt><dd class="font-medium">{{ session.source.videoCodec }} {{ session.source.width }}×{{ session.source.height }}</dd></div>
        </dl>

        <button type="button" class="mt-3 text-xs text-flixer-muted underline-offset-2 hover:text-flixer-text hover:underline" :aria-expanded="expandedId === session.id" @click="expandedId = expandedId === session.id ? null : session.id">
          {{ expandedId === session.id ? 'Hide details' : 'Show details' }}
        </button>
        <dl v-if="expandedId === session.id" class="mt-2 grid gap-2 text-xs">
          <div><dt class="text-flixer-muted">Session ID</dt><dd class="break-all font-mono">{{ session.id }}</dd></div>
          <div><dt class="text-flixer-muted">ffmpeg PID</dt><dd class="font-mono">{{ session.pid ?? 'none (between segments)' }}</dd></div>
          <div><dt class="text-flixer-muted">Audio codec</dt><dd>{{ session.source.audioCodec ?? 'none' }}</dd></div>
          <div><dt class="text-flixer-muted">Last activity</dt><dd>{{ new Date(session.lastActivityAt).toLocaleTimeString() }}</dd></div>
          <div><dt class="text-flixer-muted">Client</dt><dd class="break-all">{{ session.userAgent || 'unknown' }}</dd></div>
        </dl>
      </li>
    </ul>
  </section>
</template>
