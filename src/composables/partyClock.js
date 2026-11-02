/** Where the host's playback is right now, accounting for the time the message spent travelling. */
export function expectedPosition(state, now = Date.now()) {
    const { party: snapshot, offset } = state;
    const serverNow = state.serverTimeAtReceipt !== undefined && state.localMonotonicAtReceipt !== undefined ? state.serverTimeAtReceipt + (performance.now() - state.localMonotonicAtReceipt) : now + offset;
    return snapshot.playing ? Math.max(0, snapshot.position + ((serverNow - snapshot.at) / 1000) * snapshot.playbackRate) : snapshot.position;
}
