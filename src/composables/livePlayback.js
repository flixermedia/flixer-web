let pendingPlayback = null;
export function setPendingLivePlayback(playback) {
    pendingPlayback = playback;
}
export function takePendingLivePlayback(channelId) {
    if (pendingPlayback?.channelId !== channelId)
        return null;
    const playback = pendingPlayback;
    pendingPlayback = null;
    return playback;
}
export function clearPendingLivePlayback(channelId) {
    if (pendingPlayback?.channelId === channelId)
        pendingPlayback = null;
}
