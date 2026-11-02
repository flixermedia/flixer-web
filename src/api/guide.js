import { apiRequest } from './client';
import { resolveServerResourceUrl } from '../platform/serverConnection';
export const GUIDE_CHANNEL_PAGE_SIZE = 18;
function timestamp(value) {
    return typeof value === 'number' ? value : Date.parse(value);
}
export function toEpgData(data) {
    return {
        channels: data.channels,
        programmes: data.programmes.flatMap((programme) => {
            const start = timestamp(programme.start);
            const stop = timestamp(programme.stop);
            if (!Number.isFinite(start) || !Number.isFinite(stop) || stop <= start)
                return [];
            return [{ ...programme, start, stop }];
        }),
        totalChannels: data.totalChannels,
        channelOffset: data.channelOffset,
        sources: data.sources,
    };
}
export async function getGuide(from, to, channelOffset = 0, signal, channelLimit = GUIDE_CHANNEL_PAGE_SIZE) {
    const response = await apiRequest({
        method: 'GET',
        url: '/guide',
        params: {
            from: from.toISOString(),
            to: to.toISOString(),
            channelOffset,
            channelLimit,
        },
        timeout: 60_000,
        signal,
    });
    return toEpgData(response.data);
}
export async function getGuideChannelPlaybackInfo(id) {
    const response = await apiRequest({
        method: 'POST',
        url: `/playback/guide-channels/${encodeURIComponent(id)}/playback-info`,
    });
    return {
        ...response.data,
        mediaSource: {
            ...response.data.mediaSource,
            streamUrl: resolveServerResourceUrl(response.data.mediaSource.streamUrl),
        },
    };
}
export async function getAdminGuide() {
    const response = await apiRequest({ method: 'GET', url: '/admin/guide' });
    return response.data;
}
export async function createGuideSource(input) {
    const response = await apiRequest({ method: 'POST', url: '/admin/guide/sources', data: input });
    return response.data;
}
export async function updateGuideSource(id, changes) {
    const response = await apiRequest({
        method: 'PATCH',
        url: `/admin/guide/sources/${encodeURIComponent(id)}`,
        data: changes,
    });
    return response.data;
}
export async function refreshGuideSource(id) {
    const response = await apiRequest({
        method: 'POST',
        url: `/admin/guide/sources/${encodeURIComponent(id)}/refresh`,
    });
    return response.data;
}
export async function deleteGuideSource(id) {
    await apiRequest({ method: 'DELETE', url: `/admin/guide/sources/${encodeURIComponent(id)}` });
}
export async function updateGuideChannels(channels) {
    await apiRequest({ method: 'PUT', url: '/admin/guide/channels', data: { channels } });
}
export async function updateGuideSettings(regionalMergeThresholdPercent) {
    await apiRequest({
        method: 'PUT',
        url: '/admin/guide/settings',
        data: { regionalMergeThresholdPercent },
    });
}
