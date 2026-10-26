import type { PartySnapshot } from '../api'

export interface PartyState {
  party: PartySnapshot
  /** Server clock minus this device's clock, in ms, as measured when the state arrived. */
  offset: number
}

/** Where the host's playback is right now, accounting for the time the message spent travelling. */
export function expectedPosition(state: PartyState): number {
  const { party: snapshot, offset } = state
  return snapshot.playing ? Math.max(0, snapshot.position + (Date.now() + offset - snapshot.at) / 1000) : snapshot.position
}
