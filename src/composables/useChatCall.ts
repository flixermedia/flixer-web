import { computed, ref, shallowRef } from 'vue'
import { getChatCallIce, getChatConversation, type ChatCallIceConfig } from '../api'
import { decryptChatMlsMessage, encryptChatMlsMessage, type ChatMlsGroup } from './chatMls'
import { createChatCallGroup, joinChatCallGroup, type ChatCallInvite } from './chatMlsClient'
import { conversationTitle, onChatCallEvent, sendChatCallSignal, type ChatCallError, type ChatCallSignal } from './useChat'
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

function reset(message = '') {
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
  call.queue = call.queue.then(step).catch((error: unknown) => console.error('[call] step failed', error))
  return call.queue
}

function send(call: Call, message: CallMessage): Promise<void> {
  return enqueue(call, async () => {
    const result = await encryptChatMlsMessage(call.group, JSON.stringify(message))
    call.group = result.group
    if (!sendChatCallSignal(call.conversationId, call.id, JSON.stringify({ t: 'msg', ct: result.ciphertext }))) {
      throw new Error('Realtime connection is down.')
    }
  })
}

async function openMedia(video: boolean): Promise<MediaStream> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true }, video })
  localStream.value = stream
  return stream
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
      phase.value = 'connected'
    } else if (pc.connectionState === 'failed') {
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
      if (phase.value !== 'connecting') return
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
  if (message) await handleMessage(call, message).catch((error: unknown) => console.error('[call] message failed', error))
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
  if (current && current.id === event.callId && phase.value === 'calling') reset('unavailable')
}

/** Starts listening for calls; safe to call repeatedly. */
export function listenForChatCalls(): void {
  if (listening) return
  listening = true
  onChatCallEvent((event) => {
    if (event.type === 'call-signal') void handleSignal(event)
    else handleError(event)
  })
}

async function startCall(conversationId: string, video: boolean, label: string): Promise<void> {
  const userId = selfUserId()
  if (phase.value !== 'idle' || current || !userId) return
  notice.value = ''
  phase.value = 'calling'
  peerLabel.value = label
  withVideo.value = video
  try {
    const ice = await getChatCallIce()
    await openMedia(video)
    const { group, invite, deviceId } = await createChatCallGroup(userId, conversationId)
    const call: Call = {
      id: crypto.randomUUID(),
      conversationId,
      role: 'caller',
      group,
      deviceId,
      video,
      ice,
      queue: Promise.resolve(),
      pendingIce: [],
      outgoingIce: [],
      remoteReady: false,
    }
    current = call
    call.ringTimer = setTimeout(() => void hangUp('noAnswer'), RING_TIMEOUT_MS)
    if (!sendChatCallSignal(conversationId, call.id, JSON.stringify({ t: 'invite', ...invite }))) throw new Error('Realtime connection is down.')
    await send(call, { k: 'ring', video })
  } catch (error) {
    console.error('[call] could not start', error)
    reset(failureKey(error))
  }
}

async function accept(): Promise<void> {
  const call = current
  if (!call || call.role !== 'callee' || phase.value !== 'ringing') return
  clearTimeout(call.ringTimer)
  phase.value = 'connecting'
  try {
    call.ice = await getChatCallIce()
    await openMedia(call.video)
    await send(call, { k: 'accept', deviceId: call.deviceId })
  } catch (error) {
    console.error('[call] could not accept', error)
    await send(call, { k: 'decline' }).catch(() => undefined)
    reset(failureKey(error))
  }
}

async function decline(): Promise<void> {
  const call = current
  if (!call || call.role !== 'callee') return
  await send(call, { k: 'decline' }).catch(() => undefined)
  reset()
}

async function hangUp(message = ''): Promise<void> {
  const call = current
  if (!call) return
  if (call.role === 'callee' && phase.value === 'ringing') return decline()
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
