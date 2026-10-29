import type { PartySnapshot } from '../api'

export interface PartyState {
  party: PartySnapshot
  /** Server clock minus this device's clock, in ms, as measured when the state arrived. */
  offset: number
  /** Monotonic sample pair used to advance the server clock without relying on wall-clock changes. */
  serverTimeAtReceipt?: number
  localMonotonicAtReceipt?: number
}

/** Where the host's playback is right now, accounting for the time the message spent travelling. */
export function expectedPosition(state: PartyState, now = Date.now()): number {
  const { party: snapshot, offset } = state
  const serverNow = state.serverTimeAtReceipt !== undefined && state.localMonotonicAtReceipt !== undefined ? state.serverTimeAtReceipt + (performance.now() - state.localMonotonicAtReceipt) : now + offset
  return snapshot.playing ? Math.max(0, snapshot.position + ((serverNow - snapshot.at) / 1000) * snapshot.playbackRate) : snapshot.position
}
