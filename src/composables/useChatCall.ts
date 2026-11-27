import { computed, ref, shallowRef, watch } from 'vue'
import { getChatCallIce, getChatCallSignals, getChatConversation, postChatCallLog, type ChatCallIceConfig } from '../api'
import { decryptChatMlsMessage, encryptChatMlsMessage, type ChatMlsGroup } from './chatMls'
import { createChatCallGroup, joinChatCallGroup, type ChatCallInvite } from './chatMlsClient'
import {
  conversationTitle,
  emitChatCallSignals,
  getChatAudioContext,
  isChatSocketOpen,
  onChatCallEvent,
  sendChatCallSignalAsync,
  unlockAudio,
  useChatUnread,
  waitForChatSocket,
  type ChatCallError,
  type ChatCallSignal,
} from './useChat'
import axios from 'axios'
import { useProfile } from './useProfile'

/**
 * End-to-end encrypted 1:1 audio/video calls.
 *
 * Media flows peer-to-peer over WebRTC (DTLS-SRTP). Flixer only relays signalling: the caller creates an ephemeral MLS
 * group with the other person's devices (like a chat message does) and sends its Welcome as the invite. Everything after
 * that, including SDP (which carries the DTLS fingerprints) and ICE candidates, is an MLS application message, so the
 * server can neither read nor swap the fingerprints and cannot man-in-the-middle the media.
 */
export type CallPhase = 'idle' | 'calling' | 'ringing' | 'connecting' | 'connected'

type CallMessage =
  | { k: 'ring'; video: boolean }
  | { k: 'accept'; deviceId: string }
  | { k: 'decline' }
  | { k: 'offer'; sdp: string; to: string }
  | { k: 'answer'; sdp: string }
  | { k: 'ice'; c: RTCIceCandidateInit[] }
  | { k: 'end' }

interface Call {
  id: string
  conversationId: string
  role: 'caller' | 'callee'
  group: ChatMlsGroup
  deviceId: string
  peerDeviceId?: string
  video: boolean
  ice?: ChatCallIceConfig
  pc?: RTCPeerConnection
  queue: Promise<void>
  pendingIce: RTCIceCandidateInit[]
  outgoingIce: RTCIceCandidateInit[]
  iceTimer?: ReturnType<typeof setTimeout>
  ringTimer?: ReturnType<typeof setTimeout>
  remoteReady: boolean
  connectedAt?: number
  logged?: boolean
}

const RING_TIMEOUT_MS = 45_000
const INVITE_TTL_MS = 60_000
const ICE_BATCH_MS = 100

const phase = ref<CallPhase>('idle')
const peerLabel = ref('')
const withVideo = ref(false)
const micMuted = ref(false)
const cameraOff = ref(false)
const notice = ref('')
const localStream = shallowRef<MediaStream | null>(null)
const remoteStream = shallowRef<MediaStream | null>(null)
let current: Call | null = null
let listening = false
const available = ref(false)
let joining: { id: string; promise: Promise<void> } | null = null
let ringLoopTimer: ReturnType<typeof setInterval> | null = null
let activeRingStoppers: Array<() => void> = []
const callChannel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('flixer:call') : null

if (callChannel) {
  callChannel.onmessage = (event: MessageEvent<{ type?: string; callId?: string }>) => {
    if (event.data?.type === 'call-handled' && current && current.id === event.data.callId && phase.value === 'ringing') {
      stopRingAudio()
      reset('answeredElsewhere')
    }
  }
}

function notifyOtherTabsCallHandled(callId: string): void {
  try {
    callChannel?.postMessage({ type: 'call-handled', callId })
  } catch {
    // Ignore closed channel
  }
}

const TAB_ID = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : Math.random().toString(36).slice(2)
const RING_LOCK_KEY = 'flixer:call-ring-owner'
const RING_LOCK_TTL_MS = 4_500

function claimRingOwnership(callId: string): boolean {
  if (typeof localStorage === 'undefined') return true
  const now = Date.now()
  const isVisible = typeof document !== 'undefined' && document.visibilityState === 'visible'
  try {
    const raw = localStorage.getItem(RING_LOCK_KEY)
    if (raw) {
      const owner = JSON.parse(raw) as { tabId?: string; callId?: string; visible?: boolean; at?: number }
      const fresh = typeof owner.at === 'number' && now - owner.at < RING_LOCK_TTL_MS
      if (fresh && owner.callId === callId && owner.tabId !== TAB_ID) {
        if (!(isVisible && !owner.visible)) return false
      }
    }
    localStorage.setItem(RING_LOCK_KEY, JSON.stringify({ tabId: TAB_ID, callId, visible: isVisible, at: now }))
    return true
  } catch {
    return true
  }
}

function releaseRingOwnership(): void {
  if (typeof localStorage === 'undefined') return
  try {
    const raw = localStorage.getItem(RING_LOCK_KEY)
    if (!raw) return
    const owner = JSON.parse(raw) as { tabId?: string }
    if (owner.tabId === TAB_ID) localStorage.removeItem(RING_LOCK_KEY)
  } catch {
    // Ignore storage errors
  }
}

function stopRingAudio(): void {
  if (ringLoopTimer) {
    clearInterval(ringLoopTimer)
    ringLoopTimer = null
  }
  for (const stop of activeRingStoppers.splice(0)) stop()
  releaseRingOwnership()
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', releaseRingOwnership)
}

if (import.meta.hot) {
  import.meta.hot.dispose(stopRingAudio)
}

function playTone(ctx: AudioContext, freq: number, offset: number, duration: number, peakGain: number, type: OscillatorType = 'sine'): void {
  const start = ctx.currentTime + offset
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = type
  osc.frequency.value = freq
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime(peakGain, start + 0.02)
  gain.gain.setValueAtTime(peakGain, Math.max(start + 0.02, start + duration - 0.04))
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
  osc.connect(gain).connect(ctx.destination)
  osc.start(start)
  osc.stop(start + duration + 0.02)
  activeRingStoppers.push(() => {
    try {
      gain.gain.cancelScheduledValues(0)
      gain.gain.setValueAtTime(0, 0)
      osc.stop(0)
      osc.disconnect()
      gain.disconnect()
    } catch {
      // Already stopped
    }
  })
}

function withRunningAudio(expectedPhase: CallPhase, play: (ctx: AudioContext) => void): void {
  if (phase.value !== expectedPhase || !current) return
  if (!claimRingOwnership(current.id)) return
  const ctx = getChatAudioContext()
  if (!ctx) return
  if (ctx.state === 'running') {
    if (phase.value === expectedPhase) play(ctx)
    return
  }
  if (ctx.state === 'suspended') {
    void ctx.resume().then(() => {
      if (phase.value === expectedPhase && ctx.state === 'running') play(ctx)
    }).catch(() => undefined)
  }
}

function playOutgoingRingback(): void {
  withRunningAudio('calling', (ctx) => {
    for (const stop of activeRingStoppers.splice(0)) stop()
    // Classic warm dual-tone ringback (440 Hz + 480 Hz)
    playTone(ctx, 440, 0, 0.95, 0.055, 'sine')
    playTone(ctx, 480, 0, 0.95, 0.055, 'sine')
  })
}

function playIncomingRingtone(): void {
  withRunningAudio('ringing', (ctx) => {
    for (const stop of activeRingStoppers.splice(0)) stop()
    // Soft, subtle two-note sine chime (C5 -> E5)
    playTone(ctx, 523.25, 0, 0.28, 0.055, 'sine')
    playTone(ctx, 659.25, 0.18, 0.42, 0.06, 'sine')
  })
}

watch(phase, (next) => {
  stopRingAudio()
  if (next === 'calling') {
    unlockAudio()
    playOutgoingRingback()
    ringLoopTimer = setInterval(playOutgoingRingback, 3_200)
  } else if (next === 'ringing') {
    unlockAudio()
    playIncomingRingtone()
    ringLoopTimer = setInterval(playIncomingRingtone, 3_200)
  }
}, { flush: 'sync' })

function logCallDiagnostic(source: string, details: Record<string, unknown>, error?: unknown) {
  if (!import.meta.env.DEV) return
  const payload: Record<string, unknown> = {
    source,
    phase: phase.value,
    userId: selfUserId() ?? null,
    currentCall: current
      ? {
          id: current.id,
          conversationId: current.conversationId,
          role: current.role,
          video: current.video,
          deviceId: current.deviceId,
          peerDeviceId: current.peerDeviceId ?? null,
          pcConnectionState: current.pc?.connectionState ?? null,
          pcIceConnectionState: current.pc?.iceConnectionState ?? null,
        }
      : null,
    ...details,
  }
  if (error !== undefined) {
    payload.error = error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : error
    if (axios.isAxiosError(error)) {
      payload.http = {
        status: error.response?.status ?? null,
        data: error.response?.data ?? null,
        url: error.config?.url ?? null,
      }
    }
  }
  console.error('[call:diag]', payload)
}

/** Maps a failure to a `chat.call.notice.*` translation key. */
function failureKey(error: unknown): string {
  if (error instanceof DOMException && ['NotFoundError', 'NotReadableError', 'OverconstrainedError', 'AbortError'].includes(error.name)) return 'mediaMissing'
  if (error instanceof DOMException) return 'mediaDenied'
  if (axios.isAxiosError(error) && error.response?.status === 403) return 'disabled'
  if (error instanceof Error && error.message.includes('not set up')) return 'noDevice'
  return 'unavailable'
}

const rejectGroupChanges = () => 'reject' as const

function selfUserId(): string | undefined {
  return useProfile().profile.value?.id
}

function logCallToChat(call: Call, outcome: 'ended' | 'declined' | 'missed' | 'failed'): void {
  if (call.logged) return
  call.logged = true
  const durationSeconds = call.connectedAt ? Math.max(1, Math.round((Date.now() - call.connectedAt) / 1000)) : undefined
  void postChatCallLog({
    conversationId: call.conversationId,
    callId: call.id,
    video: call.video,
    outcome,
    durationSeconds,
  }).catch(() => undefined)
}

function reset(message = '') {
  stopRingAudio()
  const call = current
  current = null
  if (call) {
    clearTimeout(call.iceTimer)
    clearTimeout(call.ringTimer)
    call.pc?.close()
  }
  for (const track of localStream.value?.getTracks() ?? []) track.stop()
  localStream.value = null
  remoteStream.value = null
  phase.value = 'idle'
  micMuted.value = false
  cameraOff.value = false
  peerLabel.value = ''
  notice.value = message
}

/** Runs encrypt/decrypt steps one at a time because each one advances the MLS group state. */
function enqueue(call: Call, step: () => Promise<void>): Promise<void> {
  call.queue = call.queue.then(step).catch((error: unknown) => {
    logCallDiagnostic('enqueue:step', { callId: call.id }, error)
  })
  return call.queue
}

function send(call: Call, message: CallMessage): Promise<void> {
  return enqueue(call, async () => {
    const result = await encryptChatMlsMessage(call.group, JSON.stringify(message))
    call.group = result.group
    if (!(await sendChatCallSignalAsync(call.conversationId, call.id, JSON.stringify({ t: 'msg', ct: result.ciphertext })))) {
      throw new Error('Realtime connection is down.')
    }
  })
}

async function openMedia(video: boolean): Promise<{ stream: MediaStream; video: boolean }> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true }, video })
    localStream.value = stream
    return { stream, video }
  } catch (error) {
    if (video && error instanceof DOMException && ['NotFoundError', 'OverconstrainedError'].includes(error.name)) {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true }, video: false })
      localStream.value = stream
      return { stream, video: false }
    }
    throw error
  }
}

function createPeer(call: Call): RTCPeerConnection {
  const config = call.ice
  const pc = new RTCPeerConnection({
    iceServers: config?.iceServers ?? [],
    iceTransportPolicy: config?.relayOnly ? 'relay' : 'all',
  })
  for (const track of localStream.value?.getTracks() ?? []) pc.addTrack(track, localStream.value as MediaStream)
  pc.ontrack = (event) => {
    remoteStream.value = event.streams[0] ?? new MediaStream([event.track])
  }
  pc.onicecandidate = (event) => {
    if (!event.candidate) return
    call.outgoingIce.push(event.candidate.toJSON())
    call.iceTimer ??= setTimeout(() => {
      call.iceTimer = undefined
      const batch = call.outgoingIce.splice(0)
      if (batch.length > 0) void send(call, { k: 'ice', c: batch })
    }, ICE_BATCH_MS)
  }
  pc.onconnectionstatechange = () => {
    if (current !== call) return
    if (pc.connectionState === 'connected') {
      clearTimeout(call.ringTimer)
      call.connectedAt ??= Date.now()
      phase.value = 'connected'
    } else if (pc.connectionState === 'failed') {
      if (call.role === 'caller' || call.connectedAt) logCallToChat(call, call.connectedAt ? 'ended' : 'failed')
      reset('failed')
    }
  }
  call.pc = pc
  return pc
}

async function applyRemoteDescription(call: Call, type: 'offer' | 'answer', sdp: string): Promise<void> {
  const pc = call.pc
  if (!pc) return
  await pc.setRemoteDescription({ type, sdp })
  call.remoteReady = true
  for (const candidate of call.pendingIce.splice(0)) await pc.addIceCandidate(candidate)
}

async function handleMessage(call: Call, message: CallMessage): Promise<void> {
  if (current !== call) return
  switch (message.k) {
    case 'ring':
      if (call.role !== 'callee' || phase.value !== 'idle') return
      call.video = message.video === true
      withVideo.value = call.video
      phase.value = 'ringing'
      clearTimeout(call.ringTimer)
      call.ringTimer = setTimeout(() => void decline(), RING_TIMEOUT_MS)
      return
    case 'accept':
      if (call.role !== 'caller' || call.peerDeviceId || typeof message.deviceId !== 'string') return
      call.peerDeviceId = message.deviceId
      clearTimeout(call.ringTimer)
      phase.value = 'connecting'
      {
        const pc = createPeer(call)
        await pc.setLocalDescription(await pc.createOffer())
        await send(call, { k: 'offer', sdp: pc.localDescription?.sdp ?? '', to: message.deviceId })
      }
      return
    case 'offer':
      if (call.role !== 'callee') return
      if (message.to !== call.deviceId) {
        // Another of this person's devices picked up.
        reset('answeredElsewhere')
        return
      }
      if (phase.value !== 'connecting') {
        if (phase.value === 'ringing') reset('answeredElsewhere')
        return
      }
      {
        const pc = createPeer(call)
        await applyRemoteDescription(call, 'offer', message.sdp)
        await pc.setLocalDescription(await pc.createAnswer())
        await send(call, { k: 'answer', sdp: pc.localDescription?.sdp ?? '' })
      }
      return
    case 'answer':
      if (call.role === 'caller' && call.pc) await applyRemoteDescription(call, 'answer', message.sdp)
      return
    case 'ice':
      if (!Array.isArray(message.c)) return
      for (const candidate of message.c) {
        if (call.pc && call.remoteReady) await call.pc.addIceCandidate(candidate)
        else call.pendingIce.push(candidate)
      }
      return
    case 'decline':
      reset('declined')
      return
    case 'end':
      if (call.connectedAt) logCallToChat(call, 'ended')
      reset('ended')
  }
}

async function handleSignal(signal: ChatCallSignal): Promise<void> {
  let envelope: { t?: string; ct?: string } & Partial<ChatCallInvite>
  try {
    envelope = JSON.parse(signal.payload)
  } catch {
    return
  }
  if (envelope.t === 'invite') {
    const promise = handleInvite(signal, envelope as ChatCallInvite)
    joining = { id: signal.callId, promise }
    await promise
    if (joining?.promise === promise) joining = null
    return
  }
  // A "ring" can arrive while the invite is still being joined.
  if (joining?.id === signal.callId) await joining.promise
  const call = current
  if (envelope.t !== 'msg' || typeof envelope.ct !== 'string' || !call || call.id !== signal.callId) return
  const ciphertext = envelope.ct
  // Only the decrypt is queued: handling a message sends replies, which queue behind it and would deadlock if nested.
  let message: CallMessage | null = null
  await enqueue(call, async () => {
    const decrypted = await decryptChatMlsMessage(call.group, ciphertext, rejectGroupChanges)
    call.group = decrypted.group
    if (decrypted.plaintext !== null) message = JSON.parse(decrypted.plaintext) as CallMessage
  })
  if (message) {
    await handleMessage(call, message).catch((error: unknown) => {
      logCallDiagnostic('handleMessage', { callId: call.id, kind: message?.k }, error)
    })
  }
}

async function handleInvite(signal: ChatCallSignal, invite: ChatCallInvite): Promise<void> {
  const userId = selfUserId()
  if (current || !userId || !Array.isArray(invite.recipients) || typeof invite.welcome !== 'string' || typeof invite.ratchetTree !== 'string') return
  // Claim the slot first so a second invite arriving while we join is treated as busy.
  const placeholder = { id: signal.callId } as Call
  current = placeholder
  try {
    const conversation = await getChatConversation(signal.conversationId)
    const joined = conversation.kind === 'direct' ? await joinChatCallGroup(userId, signal.conversationId, invite, signal.from) : null
    if (!joined || current !== placeholder) {
      if (current === placeholder) current = null
      return
    }
    const call: Call = {
      id: signal.callId,
      conversationId: signal.conversationId,
      role: 'callee',
      group: joined.group,
      deviceId: joined.deviceId,
      video: false,
      queue: Promise.resolve(),
      pendingIce: [],
      outgoingIce: [],
      remoteReady: false,
    }
    // If the caller's "ring" never arrives the invite is stale; drop it.
    call.ringTimer = setTimeout(() => {
      if (current === call && phase.value === 'idle') reset()
    }, INVITE_TTL_MS)
    peerLabel.value = conversationTitle(conversation, useProfile().profile.value?.username)
    current = call
  } catch (error) {
    if (current === placeholder) current = null
    console.error('[call] could not join invite', error)
  }
}

function handleError(event: ChatCallError): void {
  logCallDiagnostic('server:call-error', { event })
  if (current && current.id === event.callId && phase.value === 'calling') reset('unavailable')
}

let signalPollTimer: ReturnType<typeof setTimeout> | null = null
let lastSignalSeq = 0
const seenSignals = new Set<string>()

function markSignalSeen(signal: ChatCallSignal): boolean {
  const key = `${signal.callId}:${signal.from}:${signal.payload}`
  if (seenSignals.has(key)) return false
  seenSignals.add(key)
  if (seenSignals.size > 500) {
    const first = seenSignals.values().next().value
    if (first !== undefined) seenSignals.delete(first)
  }
  return true
}

async function pollHttpCallSignals() {
  if (!listening) return
  try {
    if (!isChatSocketOpen() && selfUserId()) {
      const { signals, cursor } = await getChatCallSignals(lastSignalSeq)
      if (typeof cursor === 'number' && cursor > lastSignalSeq) lastSignalSeq = cursor
      if (signals.length) emitChatCallSignals(signals)
    }
  } catch {
    // Ignore transient polling failures
  } finally {
    if (listening) {
      const delay = phase.value === 'idle' ? 2_000 : 500
      signalPollTimer = setTimeout(() => void pollHttpCallSignals(), delay)
    }
  }
}

let signalQueue: Promise<void> = Promise.resolve()

/** Starts listening for calls; safe to call repeatedly. */
export function listenForChatCalls(): void {
  if (listening) return
  listening = true
  useChatUnread().start()
  onChatCallEvent((event) => {
    if (event.type === 'call-signal') {
      if (!markSignalSeen(event)) return
      signalQueue = signalQueue
        .then(() => handleSignal(event))
        .catch((error: unknown) => logCallDiagnostic('signalQueue', { callId: event.callId }, error))
    } else {
      handleError(event)
    }
  })
  if (!signalPollTimer) {
    signalPollTimer = setTimeout(() => void pollHttpCallSignals(), 1_000)
  }
}

async function startCall(conversationId: string, video: boolean, label: string): Promise<void> {
  if (!selfUserId()) await useProfile().load()
  const userId = selfUserId()
  if (phase.value !== 'idle' || current || !userId) return
  notice.value = ''
  phase.value = 'calling'
  peerLabel.value = label
  withVideo.value = video
  try {
    useChatUnread().ensureConnected()
    const ice = await getChatCallIce()
    const media = await openMedia(video)
    withVideo.value = media.video
    const { group, invite, deviceId } = await createChatCallGroup(userId, conversationId)
    const call: Call = {
      id: crypto.randomUUID(),
      conversationId,
      role: 'caller',
      group,
      deviceId,
      video: media.video,
      ice,
      queue: Promise.resolve(),
      pendingIce: [],
      outgoingIce: [],
      remoteReady: false,
    }
    current = call
    call.ringTimer = setTimeout(() => void hangUp('noAnswer'), RING_TIMEOUT_MS)
    const invitePayload = JSON.stringify({ t: 'invite', ...invite })
    await waitForChatSocket(500)
    if (!(await sendChatCallSignalAsync(conversationId, call.id, invitePayload))) {
      throw new Error('Call signal delivery failed.')
    }
    await send(call, { k: 'ring', video: media.video })
  } catch (error) {
    logCallDiagnostic('startCall', { conversationId, requestedVideo: video }, error)
    reset(failureKey(error))
  }
}

async function accept(): Promise<void> {
  const call = current
  if (!call || call.role !== 'callee' || phase.value !== 'ringing') return
  clearTimeout(call.ringTimer)
  stopRingAudio()
  notifyOtherTabsCallHandled(call.id)
  phase.value = 'connecting'
  try {
    call.ice = await getChatCallIce()
    const media = await openMedia(call.video)
    call.video = media.video
    withVideo.value = media.video
    await send(call, { k: 'accept', deviceId: call.deviceId })
  } catch (error) {
    logCallDiagnostic('accept', { callId: call.id, conversationId: call.conversationId }, error)
    await send(call, { k: 'decline' }).catch(() => undefined)
    reset(failureKey(error))
  }
}

async function decline(): Promise<void> {
  const call = current
  if (!call || call.role !== 'callee') return
  stopRingAudio()
  notifyOtherTabsCallHandled(call.id)
  logCallToChat(call, 'declined')
  await send(call, { k: 'decline' }).catch(() => undefined)
  reset()
}

async function hangUp(message = ''): Promise<void> {
  const call = current
  if (!call) return
  if (call.role === 'callee' && phase.value === 'ringing') return decline()
  if (call.connectedAt) {
    logCallToChat(call, 'ended')
  } else if (call.role === 'caller') {
    logCallToChat(call, 'missed')
  }
  await send(call, { k: 'end' }).catch(() => undefined)
  reset(message)
}

function toggleMic(): void {
  micMuted.value = !micMuted.value
  for (const track of localStream.value?.getAudioTracks() ?? []) track.enabled = !micMuted.value
}

function toggleCamera(): void {
  cameraOff.value = !cameraOff.value
  for (const track of localStream.value?.getVideoTracks() ?? []) track.enabled = !cameraOff.value
}

/** Checks whether the admin enabled calls; the call buttons stay hidden otherwise. */
export async function refreshChatCallAvailability(): Promise<void> {
  try {
    await getChatCallIce()
    available.value = true
  } catch {
    available.value = false
  }
}

export function dismissCallNotice(): void {
  notice.value = ''
}

export function useChatCall() {
  return {
    available: computed(() => available.value),
    phase: computed(() => phase.value),
    peerLabel: computed(() => peerLabel.value),
    video: computed(() => withVideo.value),
    micMuted: computed(() => micMuted.value),
    cameraOff: computed(() => cameraOff.value),
    notice: computed(() => notice.value),
    localStream,
    remoteStream,
    startCall,
    accept,
    decline,
    hangUp: () => hangUp(),
    toggleMic,
    toggleCamera,
  }
}
