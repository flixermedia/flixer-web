import { computed, ref, shallowRef, watch } from 'vue'
import { createParty, endParty, getAccessToken, type PartyChatMessage, type PartySnapshot, type SocialItem } from '../api'
import { i18n } from '../i18n'
import { notify } from './notify'
import { expectedPosition, type PartyState } from './partyClock'
import { useAudioPlayer, type QueueTrack } from './useAudioPlayer'
import { useProfile } from './useProfile'
import { useVideoOverlay } from './useVideoOverlay'
import { buildApiWebSocketUrl } from '../platform/serverConnection'

export { expectedPosition }
export type PartyStatus = 'idle' | 'connecting' | 'live' | 'reconnecting'

const STORAGE_KEY = 'flixer.party'
const CLOSE_UNAUTHORIZED = 4401
const HEARTBEAT_MS = 5_000
const MAX_BACKOFF_MS = 15_000
const MUSIC_DRIFT_S = 1.5
const MUSIC_JUMP_S = 2

const party = shallowRef<PartySnapshot | null>(null)
const latest = shallowRef<PartyState | null>(null)
const status = ref<PartyStatus>('idle')
const messages = shallowRef<PartyChatMessage[]>([])
const chatOpen = ref(false)
const unread = ref(0)
const MAX_CHAT_KEPT = 200

const audio = useAudioPlayer()
const videoOverlay = useVideoOverlay()
const { profile, load: loadProfile } = useProfile()

const isHost = computed(() => !!party.value && !!profile.value && party.value.host.id === profile.value.id)
const isGuest = computed(() => !!party.value && !isHost.value)

let socket: WebSocket | null = null
let wantedId: string | null = null
let retryTimer: ReturnType<typeof setTimeout> | undefined
let attempts = 0
let heartbeat: ReturnType<typeof setInterval> | undefined
let sendTimer: ReturnType<typeof setTimeout> | undefined
let lastSent = { position: 0, at: 0 }
// The guest only reopens the player when the host moves to something new, so closing it is respected.
let appliedItemId: string | null = null

function buildUrl(): string {
  return buildApiWebSocketUrl('/party')
}

function t(key: string, values?: Record<string, unknown>): string {
  return i18n.global.t(key, values ?? {}) as string
}

function send(message: unknown) {
  if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify(message))
}

function reset() {
  wantedId = null
  clearTimeout(retryTimer)
  clearTimeout(sendTimer)
  clearInterval(heartbeat)
  heartbeat = undefined
  retryTimer = undefined
  const ws = socket
  socket = null
  ws?.close()
  party.value = null
  latest.value = null
  messages.value = []
  unread.value = 0
  chatOpen.value = false
  status.value = 'idle'
  appliedItemId = null
  attempts = 0
  sessionStorage.removeItem(STORAGE_KEY)
}

function toQueueTrack(item: SocialItem): QueueTrack {
  return {
    id: item.id,
    title: item.title,
    artist: item.subtitle,
    artistId: null,
    album: null,
    albumId: null,
    art: item.imageIndex === null ? null : { itemId: item.imageItemId, index: item.imageIndex, version: item.imageUpdatedAt },
  }
}

function applyVideo(state: PartyState) {
  const { item } = state.party
  if (audio.queue.value.length > 0) audio.stop()
  if (appliedItemId === item.id) return
  appliedItemId = item.id
  videoOverlay.play({ id: item.id, title: item.subtitle ? `${item.title} · ${item.subtitle}` : item.title, startAt: expectedPosition(state) })
}

function applyAudio(state: PartyState) {
  const { item, playing } = state.party
  if (videoOverlay.playing.value) videoOverlay.close()
  // Guests who start something else are pulled back to whatever the host is playing.
  if (audio.current.value?.id !== item.id) {
    appliedItemId = item.id
    audio.playQueue([toQueueTrack(item)], 0)
    return
  }
  appliedItemId = item.id
  if (audio.isLoading.value) return
  if (Math.abs(audio.currentTime.value - expectedPosition(state)) > MUSIC_DRIFT_S) audio.seek(expectedPosition(state))
  if (playing !== audio.isPlaying.value) audio.toggle()
}

function applyState() {
  const state = latest.value
  if (!state || !isGuest.value) return
  if (state.party.kind === 'video') applyVideo(state)
  else applyAudio(state)
}

function handleEnded() {
  if (!wantedId) return
  const wasHost = isHost.value
  const kind = party.value?.kind
  reset()
  if (wasHost) return
  // Guests only watch or listen because of the party, so ending it takes them out of the player.
  if (kind === 'video') videoOverlay.close()
  else if (kind === 'music') audio.stop()
  notify.info(t('party.ended'))
}

function connect(onFirstState?: (snapshot: PartySnapshot) => void, onFailure?: (message: string) => void) {
  const token = getAccessToken()
  if (!token || !wantedId) {
    onFailure?.(t('party.signIn'))
    return
  }
  const ws = new WebSocket(buildUrl())
  socket = ws
  let settled = !onFirstState
  const fail = (message: string) => {
    if (settled) return
    settled = true
    onFailure?.(message)
  }

  ws.onopen = () => ws.send(JSON.stringify({ type: 'auth', token }))
  ws.onmessage = (event) => {
    let message: { type?: string; party?: PartySnapshot; message?: PartyChatMessage | string; messages?: PartyChatMessage[]; serverTime?: number; status?: number }
    try {
      message = JSON.parse(String(event.data))
    } catch {
      return
    }
    if (message.type === 'ready') {
      ws.send(JSON.stringify({ type: 'join', partyId: wantedId }))
    } else if (message.type === 'state' && message.party && typeof message.serverTime === 'number') {
      status.value = 'live'
      attempts = 0
      party.value = message.party
      latest.value = { party: message.party, offset: message.serverTime - Date.now() }
      if (wantedId) sessionStorage.setItem(STORAGE_KEY, wantedId)
      applyState()
      if (!settled) {
        settled = true
        onFirstState?.(message.party)
      }
    } else if (message.type === 'chat-history' && Array.isArray(message.messages)) {
      messages.value = message.messages
    } else if (message.type === 'chat' && typeof message.message === 'object') {
      receiveChat(message.message)
    } else if (message.type === 'ended') {
      handleEnded()
    } else if (message.type === 'error') {
      if (!settled) {
        fail(typeof message.message === 'string' ? message.message : t('party.joinFailed'))
        reset()
      } else if (message.status === 404) {
        handleEnded()
      } else if (message.status === 429 && typeof message.message === 'string') {
        notify.error(message.message)
      }
    }
  }
  ws.onclose = (event) => {
    if (socket !== ws) return
    socket = null
    if (!wantedId) return
    if (event.code === CLOSE_UNAUTHORIZED || !settled) {
      fail(t('party.joinFailed'))
      reset()
      return
    }
    status.value = 'reconnecting'
    retryTimer = setTimeout(() => connect(), Math.min(MAX_BACKOFF_MS, 1000 * 2 ** attempts++))
  }
}

function open(id: string): Promise<PartySnapshot> {
  if (wantedId) reset()
  wantedId = id
  status.value = 'connecting'
  return new Promise((resolve, reject) => connect(resolve, (message) => reject(new Error(message))))
}

function receiveChat(message: PartyChatMessage) {
  if (messages.value.some((existing) => existing.id === message.id)) return
  messages.value = [...messages.value, message].slice(-MAX_CHAT_KEPT)
  if (!chatOpen.value && message.from.id !== profile.value?.id) unread.value++
}

function sendChat(text: string) {
  const trimmed = text.trim()
  if (trimmed) send({ type: 'chat', text: trimmed })
}

function setChatOpen(open: boolean) {
  chatOpen.value = open
  if (open) unread.value = 0
}

function sendControl(state: { itemId?: string; playing: boolean; position: number }) {
  if (!isHost.value) return
  lastSent = { position: state.position, at: Date.now() }
  send({ type: 'control', ...state })
}

function sendMusic() {
  if (!isHost.value || party.value?.kind !== 'music') return
  const track = audio.current.value
  if (!track) return
  sendControl({ itemId: track.id, playing: audio.isPlaying.value, position: audio.currentTime.value })
}

function scheduleMusic() {
  if (!isHost.value || party.value?.kind !== 'music') return
  clearTimeout(sendTimer)
  sendTimer = setTimeout(sendMusic, 120)
}

watch([() => audio.current.value?.id, audio.isPlaying], scheduleMusic)
// Closing the player as host ends the listen party for everyone.
watch(
  () => audio.current.value,
  (track, previous) => {
    if (track || !previous || !isHost.value || party.value?.kind !== 'music') return
    void leaveParty()
  },
)
// A seek shows up as the clock jumping away from where playback would have been.
watch(audio.currentTime, (time) => {
  if (!isHost.value || party.value?.kind !== 'music') return
  const expected = lastSent.position + (audio.isPlaying.value ? (Date.now() - lastSent.at) / 1000 : 0)
  if (Math.abs(time - expected) > MUSIC_JUMP_S) scheduleMusic()
})
watch([audio.isLoading, audio.duration, audio.isPlaying], applyState)
watch(
  () => party.value?.id,
  (id) => {
    clearInterval(heartbeat)
    heartbeat = id ? setInterval(sendMusic, HEARTBEAT_MS) : undefined
  },
)

/** Guests leave the party; the host ends it for everyone. */
async function leaveParty() {
  const current = party.value
  const hosting = isHost.value
  if (!hosting) send({ type: 'leave' })
  reset()
  if (current && hosting) await endParty(current.id).catch(() => undefined)
}

export function useParty() {
  async function start(itemId: string): Promise<PartySnapshot> {
    await loadProfile()
    if (wantedId) await leave()
    const created = await createParty(itemId)
    return open(created.id)
  }

  async function join(id: string): Promise<PartySnapshot> {
    await loadProfile()
    if (party.value?.id === id) return party.value
    if (wantedId) await leave()
    return open(id)
  }

  const leave = leaveParty

  async function resume() {
    const id = sessionStorage.getItem(STORAGE_KEY)
    if (!id || wantedId) return
    await loadProfile()
    await open(id).catch(() => undefined)
  }

  function inviteLink(id = party.value?.id): string {
    return `${location.origin}/party/${id ?? ''}`
  }

  return { party, latest, status, messages, chatOpen, unread, sendChat, setChatOpen, isHost, isGuest, start, join, leave, resume, sendControl, inviteLink, expectedPosition }
}
