/** Playback metadata, stream URL helpers, and streamer-only requests. */
import axios from 'axios';
import { api } from './client';
import { resolveServerResourceUrl } from '../platform/serverConnection';
import { catchError } from '../utils/catchError';
export function buildStreamUrl(streamUrl, options = {}) {
    const params = new URLSearchParams();
    if (options.height)
        params.set('height', String(options.height));
    if (options.start && options.start > 0)
        params.set('start', options.start.toFixed(2));
    if (options.audioTrack !== undefined)
        params.set('audioTrack', String(options.audioTrack));
    const query = params.toString();
    return query ? `${streamUrl}?${query}` : streamUrl;
}
export function buildHlsUrl(streamUrl, options = {}) {
    const base = `${streamUrl.replace('/streamer/stream/', '/streamer/hls/')}/index.m3u8`;
    const params = new URLSearchParams();
    if (options.height)
        params.set('height', String(options.height));
    if (options.audioTrack !== undefined)
        params.set('audioTrack', String(options.audioTrack));
    const query = params.toString();
    return query ? `${base}?${query}` : base;
}
// Only WebKit plays HLS natively; Chromium browsers fall back to the progressive MP4/WebM stream.
export function supportsNativeHls() {
    if (typeof document === 'undefined')
        return false;
    const canPlay = document.createElement('video').canPlayType('application/vnd.apple.mpegurl');
    return canPlay !== '' && !/Chrome|Chromium|Edg\//.test(navigator.userAgent);
}
// The streamer is reached through the same-origin proxy (/streamer), not the Flixer API; the token in the URL is the credential.
export async function getStreamInfo(streamUrl, options = {}) {
    const url = buildStreamUrl(streamUrl.replace('/streamer/stream/', '/streamer/info/'), options);
    const response = await axios.get(url, { timeout: 20_000 });
    return response.data;
}
export async function listSampleVideos() {
    const response = await api.get('/playback/samples');
    return response.data;
}
export async function getSamplePlaybackInfo(id) {
    const response = await api.post(`/playback/samples/${encodeURIComponent(id)}/playback-info`);
    return { ...response.data, mediaSource: { ...response.data.mediaSource, streamUrl: resolveServerResourceUrl(response.data.mediaSource.streamUrl) } };
}
export async function getItemPlaybackInfo(id) {
    const response = await api.post(`/playback/items/${encodeURIComponent(id)}/playback-info`);
    return { ...response.data, mediaSource: { ...response.data.mediaSource, streamUrl: resolveServerResourceUrl(response.data.mediaSource.streamUrl) } };
}
/** Subtitle files beside the video, listed by the streamer for a stream token. Empty when there are none. */
export async function getSubtitleTracks(streamUrl) {
    const [error, response] = await catchError(axios.get(streamUrl.replace('/streamer/stream/', '/streamer/subtitles/'), { timeout: 20_000 }));
    if (error) {
        if (axios.isAxiosError(error) && error.response?.status === 404)
            return [];
        throw error;
    }
    return response.data.tracks ?? [];
}
/** Hover-preview thumbnails for a video, or null when none have been generated for it yet. */
export async function getTrickplay(streamUrl) {
    const base = streamUrl.replace('/streamer/stream/', '/streamer/trickplay/');
    const [error, response] = await catchError(axios.get(`${base}/index.json`, { timeout: 10_000 }));
    if (error)
        return null;
    const manifest = response.data;
    if (!manifest || manifest.count <= 0 || manifest.intervalMs <= 0 || manifest.columns <= 0 || manifest.rows <= 0)
        return null;
    return { manifest, sheetUrl: (sheet) => `${base}/${sheet}.jpg` };
}
/** WebVTT text for one subtitle file. */
export async function getSubtitleText(streamUrl, id) {
    const response = await axios.get(streamUrl.replace('/streamer/stream/', '/streamer/subtitles/'), {
        params: { file: id },
        responseType: 'text',
        transformResponse: (data) => data,
        timeout: 20_000,
    });
    return response.data;
}
/** Raw LRC text for a track's stream token, or null when the track has no lyrics file. */
export async function getTrackLyrics(streamUrl) {
    const requestUrl = streamUrl.replace('/streamer/stream/', '/streamer/lyrics/');
    const [error, response] = await catchError(axios.get(requestUrl, { responseType: 'text', transformResponse: (data) => data, timeout: 20_000 }));
    if (error) {
        if (axios.isAxiosError(error) && error.response?.status === 404)
            return null;
        throw error;
    }
    return response.data;
}
