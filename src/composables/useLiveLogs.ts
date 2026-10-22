import { onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'
import { getAccessToken } from '../api'

export interface LiveLogEntry {
  id: number
  time: string
  level: 'debug' | 'info' | 'warn' | 'error'
  app: string
  source: string
  message: string
  fields?: Record<string, unknown>
}

export type LiveLogStatus = 'connecting' | 'live' | 'disconnected' | 'unauthorized'

const MAX_ENTRIES = 1000

function buildUrl(): string {
  const base: string = import.meta.env.VITE_API_BASE_URL || '/api'
  const path = `${base.replace(/\/$/, '')}/logs/stream`
  if (/^https?:\/\//.test(path)) return path.replace(/^http/, 'ws')
  return `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}${path}`
}

/** Streams backend logs over a WebSocket, reconnecting with backoff. */
export function useLiveLogs() {
  const entries = shallowRef<LiveLogEntry[]>([])
  const status = ref<LiveLogStatus>('connecting')
  const paused = ref(false)
  let socket: WebSocket | null = null
  let retryTimer: ReturnType<typeof setTimeout> | undefined
  let attempts = 0
  let stopped = false
  let pending: LiveLogEntry[] = []

  function append(items: LiveLogEntry[]) {
    if (paused.value) {
      pending = pending.concat(items).slice(-MAX_ENTRIES)
      return
    }
    entries.value = entries.value.concat(items).slice(-MAX_ENTRIES)
  }

  function connect() {
    if (stopped) return
    status.value = 'connecting'
    const token = getAccessToken()
    if (!token) {
      status.value = 'unauthorized'
      return
    }
    const ws = new WebSocket(buildUrl())
    socket = ws
    ws.onopen = () => ws.send(JSON.stringify({ type: 'auth', token }))
    ws.onmessage = (event) => {
      let msg: { type: string; entries?: LiveLogEntry[]; entry?: LiveLogEntry }
      try {
        msg = JSON.parse(String(event.data))
      } catch {
        return
      }
      if (msg.type === 'snapshot') {
        status.value = 'live'
        attempts = 0
        pending = []
        entries.value = (msg.entries ?? []).slice(-MAX_ENTRIES)
      } else if (msg.type === 'log' && msg.entry) {
        append([msg.entry])
      }
    }
    ws.onclose = (event) => {
      if (socket !== ws) return
      socket = null
      if (event.code === 4401 || event.code === 4403) {
        status.value = 'unauthorized'
        return
      }
      status.value = 'disconnected'
      if (stopped) return
      const delay = Math.min(30000, 1000 * 2 ** attempts++)
      retryTimer = setTimeout(connect, delay)
    }
  }

  function pause() {
    paused.value = true
  }

  function resume() {
    paused.value = false
    if (pending.length) {
      entries.value = entries.value.concat(pending).slice(-MAX_ENTRIES)
      pending = []
    }
  }

  function clear() {
    entries.value = []
    pending = []
  }

  onMounted(connect)
  onBeforeUnmount(() => {
    stopped = true
    clearTimeout(retryTimer)
    socket?.close()
  })

  return { entries, status, paused, pause, resume, clear }
}
