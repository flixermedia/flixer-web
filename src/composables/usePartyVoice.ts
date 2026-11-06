import { computed, effectScope, ref, shallowRef, watch } from 'vue'
import axios from 'axios'
import { claimPartyCallKeyPackage, getPartyCallIce, getPartyCallKeyPackages, type ChatCallIceConfig } from '../api'
import { decryptChatMlsMessage, encryptChatMlsMessage, type ChatMlsGroup } from './chatMls'
import { createPartyPeerGroup, joinPartyPeerGroup, type ChatCallInvite, type ChatKeyPackageSource } from './chatMlsClient'
import { onPartyCallSignal, sendPartyCallSignal, useParty, type PartyCallSignal } from './useParty'
import { useProfile } from './useProfile'

/**
 * End-to-end encrypted party voice chat.
 *
 * Voice is a mesh of peer-to-peer WebRTC links, one per pair of people. Each link has its own ephemeral MLS group (the
 * same handshake as a 1:1 call, but auto-accepted), so SDP and DTLS fingerprints are never readable or swappable by the
 * server. A newcomer announces itself with a plaintext `hello` (carrying nothing secret); people already in voice answer
 * `here`, and the newcomer starts a link with each of them.
 */
type LinkMessage =
  | { k: 'accept'; deviceId: string }
  | { k: 'offer'; sdp: string; to: string }
  | { k: 'answer'; sdp: string }
  | { k: 'ice'; c: RTCIceCandidateInit[] }
  | { k: 'bye' }

interface Link {
  id: string
  peerId: string
  initiator: boolean
  group: ChatMlsGroup
  deviceId: string
  pc?: RTCPeerConnection
  audio?: HTMLAudioElement
  queue: Promise<void>
  pendingIce: RTCIceCandidateInit[]
  outgoingIce: RTCIceCandidateInit[]
  iceTimer?: ReturnType<typeof setTimeout>
  connectTimer?: ReturnType<typeof setTimeout>
  remoteReady: boolean
}

/** Full-mesh voice stays comfortable up to about this many people. */
export const PARTY_VOICE_MAX_PEERS = 5
const HELLO_ID = 'voice'
const ICE_BATCH_MS = 100
const CONNECT_TIMEOUT_MS = 30_000

const active = ref(false)
const joining = ref(false)
const available = ref(false)
const micMuted = ref(false)
const notice = ref('')
const connectedPeers = ref<string[]>([])
const localStream = shallowRef<MediaStream | null>(null)
const links = new Map<string, Link>()
let ice: ChatCallIceConfig | undefined
let partyId = ''
let listening = false

const rejectGroupChanges = () => 'reject' as const

function selfUserId(): string | undefined {
  return useProfile().profile.value?.id
}

function failureKey(error: unknown): string {
  if (error instanceof DOMException && ['NotFoundError', 'NotReadableError', 'OverconstrainedError', 'AbortError'].includes(error.name)) return 'mediaMissing'
  if (error instanceof DOMException) return 'mediaDenied'
  if (axios.isAxiosError(error) && error.response?.status === 403) return 'disabled'
  return 'unavailable'
}

function peerSource(peerId: string): ChatKeyPackageSource {
  return {
    list: (lenient) => getPartyCallKeyPackages(partyId, peerId, lenient),
    claim: (keyPackageId) => claimPartyCallKeyPackage(partyId, keyPackageId),
  }
}

function enqueue(link: Link, step: () => Promise<void>): Promise<void> {
  link.queue = link.queue.then(step).catch((error: unknown) => console.error('[party voice] step failed', error))
  return link.queue
}

function send(link: Link, message: LinkMessage): Promise<void> {
  return enqueue(link, async () => {
    const result = await encryptChatMlsMessage(link.group, JSON.stringify(message))
    link.group = result.group
    if (!sendPartyCallSignal(link.id, JSON.stringify({ t: 'msg', ct: result.ciphertext }), link.peerId)) {
      throw new Error('Realtime connection is down.')
    }
  })
}

function syncConnected() {
  connectedPeers.value = [...links.values()].filter((link) => link.pc?.connectionState === 'connected').map((link) => link.peerId)
}

function dropLink(link: Link, notifyPeer: boolean) {
  if (links.get(link.peerId) !== link) return
  links.delete(link.peerId)
  clearTimeout(link.iceTimer)
  clearTimeout(link.connectTimer)
  if (notifyPeer) void send(link, { k: 'bye' }).catch(() => undefined)
  link.pc?.close()
  if (link.audio) {
    link.audio.srcObject = null
    link.audio.remove()
  }
  syncConnected()
}

function createPeer(link: Link): RTCPeerConnection {
  const pc = new RTCPeerConnection({
    iceServers: ice?.iceServers ?? [],
    iceTransportPolicy: ice?.relayOnly ? 'relay' : 'all',
  })
  for (const track of localStream.value?.getTracks() ?? []) pc.addTrack(track, localStream.value as MediaStream)
  pc.ontrack = (event) => {
    const audio = link.audio ?? document.createElement('audio')
    audio.autoplay = true
    audio.srcObject = event.streams[0] ?? new MediaStream([event.track])
    link.audio = audio
    void audio.play().catch(() => undefined)
  }
  pc.onicecandidate = (event) => {
    if (!event.candidate) return
    link.outgoingIce.push(event.candidate.toJSON())
    link.iceTimer ??= setTimeout(() => {
      link.iceTimer = undefined
      const batch = link.outgoingIce.splice(0)
      if (batch.length > 0) void send(link, { k: 'ice', c: batch })
    }, ICE_BATCH_MS)
  }
  pc.onconnectionstatechange = () => {
    if (links.get(link.peerId) !== link) return
    if (pc.connectionState === 'connected') clearTimeout(link.connectTimer)
    if (pc.connectionState === 'failed' || pc.connectionState === 'closed') dropLink(link, false)
    syncConnected()
  }
  link.connectTimer = setTimeout(() => {
    if (pc.connectionState !== 'connected') dropLink(link, true)
  }, CONNECT_TIMEOUT_MS)
  link.pc = pc
  return pc
}

async function applyRemoteDescription(link: Link, type: 'offer' | 'answer', sdp: string): Promise<void> {
  const pc = link.pc
  if (!pc) return
  await pc.setRemoteDescription({ type, sdp })
  link.remoteReady = true
  for (const candidate of link.pendingIce.splice(0)) await pc.addIceCandidate(candidate)
}

async function handleMessage(link: Link, message: LinkMessage): Promise<void> {
  if (links.get(link.peerId) !== link) return
  switch (message.k) {
    case 'accept': {
      if (!link.initiator || link.pc || typeof message.deviceId !== 'string') return
      const pc = createPeer(link)
      await pc.setLocalDescription(await pc.createOffer())
      await send(link, { k: 'offer', sdp: pc.localDescription?.sdp ?? '', to: message.deviceId })
      return
    }
    case 'offer': {
      if (link.initiator || link.pc || message.to !== link.deviceId) return
      const pc = createPeer(link)
      await applyRemoteDescription(link, 'offer', message.sdp)
      await pc.setLocalDescription(await pc.createAnswer())
      await send(link, { k: 'answer', sdp: pc.localDescription?.sdp ?? '' })
      return
    }
    case 'answer':
      if (link.initiator && link.pc) await applyRemoteDescription(link, 'answer', message.sdp)
      return
    case 'ice':
      if (!Array.isArray(message.c)) return
      for (const candidate of message.c) {
        if (link.pc && link.remoteReady) await link.pc.addIceCandidate(candidate)
        else link.pendingIce.push(candidate)
      }
      return
    case 'bye':
      dropLink(link, false)
  }
}

function memberIds(): Set<string> {
  return new Set(useParty().party.value?.members.map((member) => member.id) ?? [])
}

async function connectTo(peerId: string): Promise<void> {
  const userId = selfUserId()
  if (!active.value || !userId || links.has(peerId) || links.size >= PARTY_VOICE_MAX_PEERS) return
  const placeholder = { peerId } as Link
  links.set(peerId, placeholder)
  try {
    const { group, invite, deviceId } = await createPartyPeerGroup(userId, peerSource(peerId))
    if (links.get(peerId) !== placeholder || !active.value) {
      if (links.get(peerId) === placeholder) links.delete(peerId)
      return
    }
    const link: Link = {
      id: crypto.randomUUID(),
      peerId,
      initiator: true,
      group,
      deviceId,
      queue: Promise.resolve(),
      pendingIce: [],
      outgoingIce: [],
      remoteReady: false,
    }
    links.set(peerId, link)
    link.connectTimer = setTimeout(() => {
      if (link.pc?.connectionState !== 'connected') dropLink(link, true)
    }, CONNECT_TIMEOUT_MS)
    if (!sendPartyCallSignal(link.id, JSON.stringify({ t: 'invite', ...invite }), peerId)) throw new Error('Realtime connection is down.')
  } catch (error) {
    if (links.get(peerId) === placeholder) links.delete(peerId)
    console.error('[party voice] could not reach', peerId, error)
  }
}

async function acceptInvite(signal: PartyCallSignal, invite: ChatCallInvite): Promise<void> {
  const userId = selfUserId()
  if (!active.value || !userId || links.has(signal.from) || links.size >= PARTY_VOICE_MAX_PEERS || !memberIds().has(signal.from)) return
  if (!Array.isArray(invite.recipients) || typeof invite.welcome !== 'string' || typeof invite.ratchetTree !== 'string') return
  const placeholder = { peerId: signal.from } as Link
  links.set(signal.from, placeholder)
  try {
    const joined = await joinPartyPeerGroup(userId, peerSource(signal.from), invite, signal.from)
    if (!joined || links.get(signal.from) !== placeholder || !active.value) {
      if (links.get(signal.from) === placeholder) links.delete(signal.from)
      return
    }
    const link: Link = {
      id: signal.callId,
      peerId: signal.from,
      initiator: false,
      group: joined.group,
      deviceId: joined.deviceId,
      queue: Promise.resolve(),
      pendingIce: [],
      outgoingIce: [],
      remoteReady: false,
    }
    links.set(signal.from, link)
    link.connectTimer = setTimeout(() => {
      if (link.pc?.connectionState !== 'connected') dropLink(link, true)
    }, CONNECT_TIMEOUT_MS)
    await send(link, { k: 'accept', deviceId: link.deviceId })
  } catch (error) {
    if (links.get(signal.from) === placeholder) links.delete(signal.from)
    console.error('[party voice] could not accept link', error)
  }
}

async function handleSignal(signal: PartyCallSignal): Promise<void> {
  const userId = selfUserId()
  if (!active.value || !userId || signal.from === userId) return
  let envelope: { t?: string; ct?: string } & Partial<ChatCallInvite>
  try {
    envelope = JSON.parse(signal.payload)
  } catch {
    return
  }
  if (signal.callId === HELLO_ID) {
    if (!memberIds().has(signal.from)) return
    if (envelope.t === 'hello') sendPartyCallSignal(HELLO_ID, JSON.stringify({ t: 'here' }), signal.from)
    else if (envelope.t === 'here' && signal.to === userId) await connectTo(signal.from)
    return
  }
  if (envelope.t === 'invite') {
    await acceptInvite(signal, envelope as ChatCallInvite)
    return
  }
  const link = links.get(signal.from)
  if (envelope.t !== 'msg' || typeof envelope.ct !== 'string' || !link?.group || link.id !== signal.callId) return
  const ciphertext = envelope.ct
  // Only the decrypt is queued: handling a message sends replies, which queue behind it and would deadlock if nested.
  let message: LinkMessage | null = null
  await enqueue(link, async () => {
    const decrypted = await decryptChatMlsMessage(link.group, ciphertext, rejectGroupChanges)
    link.group = decrypted.group
    if (decrypted.plaintext !== null) message = JSON.parse(decrypted.plaintext) as LinkMessage
  })
  if (message) await handleMessage(link, message).catch((error: unknown) => console.error('[party voice] message failed', error))
}

function listen() {
  if (listening) return
  listening = true
  onPartyCallSignal((signal) => void handleSignal(signal))
  // Detached so the watchers outlive whichever component first used the composable.
  effectScope(true).run(() => {
    // Drop links to people who have left the party.
    watch(
      () =>
        useParty()
          .party.value?.members.map((member) => member.id)
          .join(','),
      () => {
        const members = memberIds()
        for (const link of [...links.values()]) if (!members.has(link.peerId)) dropLink(link, false)
      },
    )
    watch(
      () => useParty().party.value?.id,
      (id) => {
        if (id !== partyId || !id) leaveVoice()
        void refreshPartyVoiceAvailability()
      },
      { immediate: true },
    )
  })
}

export async function refreshPartyVoiceAvailability(): Promise<void> {
  const id = useParty().party.value?.id
  if (!id) {
    available.value = false
    return
  }
  try {
    await getPartyCallIce(id)
    available.value = true
  } catch {
    available.value = false
  }
}

async function joinVoice(): Promise<void> {
  const party = useParty().party.value
  if (active.value || joining.value || !party || !selfUserId()) return
  listen()
  notice.value = ''
  joining.value = true
  try {
    partyId = party.id
    ice = await getPartyCallIce(party.id)
    localStream.value = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true }, video: false })
    micMuted.value = false
    active.value = true
    if (!sendPartyCallSignal(HELLO_ID, JSON.stringify({ t: 'hello' }))) throw new Error('Realtime connection is down.')
  } catch (error) {
    console.error('[party voice] could not join', error)
    notice.value = failureKey(error)
    leaveVoice(notice.value)
  } finally {
    joining.value = false
  }
}

function leaveVoice(message = ''): void {
  for (const link of [...links.values()]) if (link.group) dropLink(link, true)
  links.clear()
  for (const track of localStream.value?.getTracks() ?? []) track.stop()
  localStream.value = null
  active.value = false
  micMuted.value = false
  connectedPeers.value = []
  notice.value = message
}

function toggleMic(): void {
  micMuted.value = !micMuted.value
  for (const track of localStream.value?.getAudioTracks() ?? []) track.enabled = !micMuted.value
}

/** Starts listening for voice signalling; safe to call repeatedly. */
export function listenForPartyVoice(): void {
  listen()
  void refreshPartyVoiceAvailability()
}

export function usePartyVoice() {
  listen()
  return {
    active,
    joining,
    available,
    micMuted,
    notice,
    connectedPeers,
    peerCount: computed(() => connectedPeers.value.length),
    join: joinVoice,
    leave: () => leaveVoice(),
    toggleMic,
  }
}
