import * as dashjs from 'dashjs';
import Hls from 'hls.js';
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { buildHlsUrl, buildStreamUrl, getStreamInfo, getSubtitleText, getSubtitleTracks, getTrickplay, supportsNativeHls } from '../../api';
import { useParty } from '../../composables/useParty';
import PartyChat from '../party/PartyChat.vue';
import PartyPanel from '../party/PartyPanel.vue';
import { audioTrackLabel, preferredAudioTrack, selectedAudioStreamIndex } from '../../composables/audioTracks';
import { thumbnailAt } from '../../composables/trickplay';
import { cueTextAt, languageName, parseVtt } from '../../composables/subtitles';
import { catchError } from '../../utils/catchError';
const { defineProps, defineEmits, defineExpose, withDefaults, } = {};
const props = withDefaults(defineProps(), { autoplay: true, showBack: false, allowMini: false, liveGuideOpen: false, mini: false, startAt: 0, chapters: () => [], segments: () => [], autoSkipIntroCredits: true, defaultAudioLanguage: '', container: 'm3u8' });
const emit = defineEmits();
const METHOD_LABELS = {
    DirectPlay: 'player.methodDirectPlay',
    DirectStream: 'player.methodDirectStream',
    Transcode: 'player.methodTranscode',
};
const { t, locale } = useI18n();
const SKIP_SECONDS = 10;
const REMOTE_DRIFT_IGNORE_S = 0.15;
const REMOTE_DRIFT_SEEK_S = 1;
// Transcoded streams need a larger threshold because seeking restarts the rendition.
const REMOTE_DRIFT_S = 2;
const REMOTE_DRIFT_RELOAD_S = 6;
const REMOTE_RELOAD_COOLDOWN_MS = 10_000;
let lastRemoteReload = 0;
let remoteSeekTarget = null;
let remoteSeekUntil = 0;
let remotePlaybackTarget = null;
let remotePlaybackUntil = 0;
const HIDE_DELAY_MS = 3000;
const DASH_START_TIMEOUT_MS = 20_000;
const VOLUME_KEY = 'flixer.player.volume';
const SUBTITLE_KEY = 'flixer.player.subtitles';
const AUTO_SKIP_TYPES = ['recap', 'preview', 'commercial'];
const AUTO_SKIP_SEGMENT_TYPES = ['intro', 'credits'];
const AUTO_SKIP_LEAD_SECONDS = 5;
// Leaves a moment at the end of a segment so the button doesn't flash up as it finishes.
const SEGMENT_END_GUARD_S = 1;
const root = ref();
const video = ref();
const bar = ref();
// Quality 0 means the original resolution.
const height = ref(0);
// Remuxed/transcoded streams restart at `offset`, so the element's clock is relative to it.
const offset = ref(0);
const current = ref(0);
const bufferedEnd = ref(0);
const nativeDuration = ref(0);
const paused = ref(true);
const waiting = ref(true);
const ended = ref(false);
const volume = ref(1);
const muted = ref(false);
const controlsVisible = ref(true);
const menuOpen = ref(false);
const partyMenuOpen = ref(false);
const streamInfo = shallowRef(props.info);
const audioTracks = computed(() => props.info.source.audioTracks ?? []);
const selectedAudioTrackIndex = ref(preferredAudioTrack(audioTracks.value, props.defaultAudioLanguage)?.index ?? null);
const selectedAudioTrackQuery = computed(() => selectedAudioStreamIndex(audioTracks.value, selectedAudioTrackIndex.value));
const audioTrackOptions = computed(() => audioTracks.value.map((track, index) => ({
    track,
    label: audioTrackLabel(track, locale.value) || t('player.audioTrackNumber', { number: index + 1 }),
})));
const partyState = useParty();
function togglePartyMenu() {
    partyMenuOpen.value = !partyMenuOpen.value;
    menuOpen.value = false;
    partyState.setChatOpen(false);
}
function toggleChat() {
    partyState.setChatOpen(!partyState.chatOpen.value);
    menuOpen.value = false;
    partyMenuOpen.value = false;
}
function toggleSettingsMenu() {
    menuOpen.value = !menuOpen.value;
    partyMenuOpen.value = false;
    partyState.setChatOpen(false);
}
const inVideoParty = computed(() => partyState.party.value?.kind === 'video');
const isFullscreen = ref(false);
const isPip = ref(false);
const pipSupported = typeof document !== 'undefined' && document.pictureInPictureEnabled === true;
const errorMessage = ref('');
const scrubbing = ref(false);
const scrubTime = ref(0);
const hoverTime = ref(null);
// Hover previews; null until the streamer has sheets for this video.
const trickplay = shallowRef(null);
const THUMB_WIDTH = 176;
let warmedSheets = false;
let nativeStart = 0;
let hideTimer;
let progressTimer;
const PROGRESS_INTERVAL_MS = 15000;
let frame = 0;
let lastPointerType = 'mouse';
const nativeHls = supportsNativeHls();
const directPlay = computed(() => height.value === 0 && streamInfo.value.playMethod === 'DirectPlay');
const useHls = computed(() => !props.live && nativeHls && !directPlay.value);
// Direct play and HLS both use the browser's own clock and seeking.
const isNative = computed(() => directPlay.value || useHls.value);
const mode = computed(() => (height.value > 0 ? 'Transcode' : streamInfo.value.playMethod));
const duration = computed(() => {
    if (isNative.value && Number.isFinite(nativeDuration.value) && nativeDuration.value > 0)
        return nativeDuration.value;
    return props.info.source.durationSeconds;
});
const position = computed(() => {
    if (scrubbing.value)
        return scrubTime.value;
    return isNative.value ? current.value : offset.value + current.value;
});
const autoSkip = computed(() => props.autoSkipIntroCredits);
const autoSkipped = new Set();
const manualSkipPromptSegments = new Set();
const activeSegment = computed(() => {
    const time = position.value;
    return props.segments.find((segment) => time >= segment.startMs / 1000 && time < segment.endMs / 1000 - SEGMENT_END_GUARD_S) ?? null;
});
const segmentKey = (segment) => `${segment.type}:${segment.startMs}`;
const autoSkipSegment = computed(() => {
    if (!props.autoSkipIntroCredits || props.locked || scrubbing.value)
        return null;
    const time = position.value;
    return (props.segments.find((segment) => {
        if (!AUTO_SKIP_SEGMENT_TYPES.includes(segment.type) || autoSkipped.has(segmentKey(segment)))
            return false;
        const start = segment.startMs / 1000;
        const end = segment.endMs / 1000 - SEGMENT_END_GUARD_S;
        const countdownStart = start <= AUTO_SKIP_LEAD_SECONDS ? 0 : start - AUTO_SKIP_LEAD_SECONDS;
        return time >= countdownStart && time < end;
    }) ?? null);
});
const autoSkipCountdown = computed(() => {
    const segment = autoSkipSegment.value;
    if (!segment || manualSkipPromptSegments.has(segmentKey(segment)))
        return null;
    const start = segment.startMs / 1000;
    const countdownTarget = start <= AUTO_SKIP_LEAD_SECONDS ? AUTO_SKIP_LEAD_SECONDS : start;
    return Math.max(0, Math.ceil(countdownTarget - position.value));
});
const skipButtonSegment = computed(() => autoSkipSegment.value ?? activeSegment.value);
const chapterTicks = computed(() => props.chapters.filter((chapter) => chapter.startMs > 0).map((chapter) => percent(chapter.startMs / 1000)));
const hoverChapter = computed(() => {
    if (hoverTime.value === null)
        return '';
    const ms = hoverTime.value * 1000;
    return props.chapters.find((chapter) => ms >= chapter.startMs && ms < chapter.endMs)?.title ?? '';
});
const qualityOptions = computed(() => [...props.info.availableHeights].sort((a, b) => b - a));
watch(() => props.streamUrl, () => {
    autoSkipped.clear();
    manualSkipPromptSegments.clear();
});
// Subtitles are drawn by the player so they stay in step when a transcode restarts at an offset.
const subtitleTracks = ref([]);
const subtitleId = ref('');
const subtitleCues = ref([]);
const playhead = computed(() => (isNative.value ? current.value : offset.value + current.value));
const subtitleText = computed(() => (subtitleId.value ? cueTextAt(subtitleCues.value, playhead.value) : ''));
function subtitleLabel(track) {
    const name = languageName(track.language, locale.value);
    return track.label ? `${name} (${track.label})` : name;
}
async function selectSubtitle(id) {
    menuOpen.value = false;
    subtitleId.value = id;
    subtitleCues.value = [];
    const track = subtitleTracks.value.find((candidate) => candidate.id === id);
    try {
        localStorage.setItem(SUBTITLE_KEY, track ? track.language : 'off');
    }
    catch {
        // Remembering the choice is optional.
    }
    if (!track)
        return;
    const [error, text] = await catchError(Promise.resolve().then(() => getSubtitleText(props.streamUrl, id)));
    if (error) {
        if (subtitleId.value === id)
            subtitleId.value = '';
        return;
    }
    let cues;
    try {
        cues = parseVtt(text);
    }
    catch {
        if (subtitleId.value === id)
            subtitleId.value = '';
        return;
    }
    if (subtitleId.value === id)
        subtitleCues.value = cues;
}
async function loadTrickplay() {
    if (props.live) {
        trickplay.value = null;
        return;
    }
    const url = props.streamUrl;
    trickplay.value = null;
    warmedSheets = false;
    const loaded = await getTrickplay(url);
    if (url === props.streamUrl)
        trickplay.value = loaded;
}
// Fetch every sheet once the viewer first points at the bar, so dragging never waits on an image.
function warmTrickplay() {
    if (warmedSheets || !trickplay.value)
        return;
    warmedSheets = true;
    for (let sheet = 0; sheet < trickplay.value.manifest.sheets; sheet++)
        new Image().src = trickplay.value.sheetUrl(sheet);
}
async function loadSubtitleTracks() {
    if (props.live) {
        subtitleTracks.value = [];
        subtitleId.value = '';
        subtitleCues.value = [];
        return;
    }
    subtitleTracks.value = [];
    subtitleId.value = '';
    subtitleCues.value = [];
    const [error, tracks] = await catchError(Promise.resolve().then(() => getSubtitleTracks(props.streamUrl)));
    if (error)
        return;
    subtitleTracks.value = tracks;
    let preferred = null;
    try {
        preferred = localStorage.getItem(SUBTITLE_KEY);
    }
    catch {
        // No saved preference.
    }
    if (!preferred || preferred === 'off')
        return;
    const match = subtitleTracks.value.find((track) => track.language === preferred);
    if (match)
        await selectSubtitle(match.id);
}
const controlsShown = computed(() => !props.mini && (controlsVisible.value || paused.value || menuOpen.value || partyMenuOpen.value || scrubbing.value || !!errorMessage.value));
const showCenterPlay = computed(() => !props.mini && paused.value && !waiting.value && !errorMessage.value);
const hoverPercent = computed(() => (hoverTime.value === null ? 0 : percent(hoverTime.value)));
const hoverThumb = computed(() => {
    if (!trickplay.value || hoverTime.value === null)
        return null;
    const place = thumbnailAt(trickplay.value.manifest, hoverTime.value, THUMB_WIDTH);
    return {
        width: `${place.width}px`,
        height: `${place.height}px`,
        backgroundImage: `url(${trickplay.value.sheetUrl(place.sheet)})`,
        backgroundSize: `${place.sheetWidth}px ${place.sheetHeight}px`,
        backgroundPosition: `-${place.x}px -${place.y}px`,
    };
});
function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}
function percent(seconds) {
    return duration.value > 0 ? clamp((seconds / duration.value) * 100, 0, 100) : 0;
}
function suppressInitialSkipCountdown(time) {
    for (const segment of props.segments) {
        if (!AUTO_SKIP_SEGMENT_TYPES.includes(segment.type))
            continue;
        const start = segment.startMs / 1000;
        const end = segment.endMs / 1000 - SEGMENT_END_GUARD_S;
        if (time >= start && time < end)
            manualSkipPromptSegments.add(segmentKey(segment));
    }
}
function skipSegment(segment = activeSegment.value) {
    if (!segment || props.locked)
        return;
    autoSkipped.add(segmentKey(segment));
    seekTo(segment.endMs / 1000);
}
function setAutoSkip(value) {
    emit('auto-skip-intro-credits-change', value);
}
// Each segment auto-skips once, so seeking back into it plays it.
watch(activeSegment, (segment) => {
    if (!segment || !autoSkip.value || props.mini || props.locked || scrubbing.value || !AUTO_SKIP_TYPES.includes(segment.type))
        return;
    const key = segmentKey(segment);
    if (autoSkipped.has(key))
        return;
    skipSegment();
});
watch(autoSkipCountdown, (countdown) => {
    const segment = autoSkipSegment.value;
    if (countdown !== 0 || !segment)
        return;
    skipSegment(segment);
});
function format(seconds) {
    const whole = Math.max(0, Math.floor(seconds));
    const h = Math.floor(whole / 3600);
    const m = Math.floor((whole % 3600) / 60);
    const s = String(whole % 60).padStart(2, '0');
    return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`;
}
function tryPlay() {
    void video.value?.play().catch(() => { });
}
let loadToken = 0;
let hlsPlayer;
let dashPlayer;
let dashStartupTimer;
async function loadSource(opts = {}) {
    const el = video.value;
    if (!el)
        return false;
    const token = ++loadToken;
    const resume = opts.resume ?? !el.paused;
    if (opts.height !== undefined)
        height.value = opts.height;
    let start = Math.max(0, opts.start ?? 0);
    el.playbackRate = 1;
    errorMessage.value = '';
    waiting.value = true;
    ended.value = false;
    const previousInfo = streamInfo.value;
    let nextInfo = props.info;
    const audioTrack = selectedAudioTrackQuery.value;
    const needsKeyframe = !props.live && height.value === 0 && start > 0 && previousInfo.playMethod !== 'DirectPlay';
    if (!props.live && (audioTrack !== undefined || needsKeyframe)) {
        const [error, inspected] = await catchError(Promise.resolve().then(() => getStreamInfo(props.streamUrl, { height: height.value || undefined, start, audioTrack })));
        if (token !== loadToken)
            return false;
        if (error) {
            if (audioTrack !== undefined) {
                console.error('Could not inspect the selected audio track', error);
                streamInfo.value = previousInfo;
                errorMessage.value = t('player.audioTrackUnavailable');
                waiting.value = false;
                return false;
            }
        }
        else {
            nextInfo = inspected;
        }
    }
    streamInfo.value = nextInfo;
    // A stream-copy seek starts at the previous keyframe, so use the real start for the clock and subtitles.
    if (!isNative.value && height.value === 0 && start > 0 && typeof nextInfo.keyframeStart === 'number' && nextInfo.keyframeStart <= start) {
        start = nextInfo.keyframeStart;
    }
    if (isNative.value) {
        nativeStart = start;
        offset.value = 0;
        current.value = start;
    }
    else {
        nativeStart = 0;
        offset.value = start;
        current.value = 0;
    }
    bufferedEnd.value = start;
    hlsPlayer?.destroy();
    hlsPlayer = undefined;
    clearTimeout(dashStartupTimer);
    dashStartupTimer = undefined;
    dashPlayer?.reset();
    dashPlayer = undefined;
    if (props.live && props.container === 'mpd') {
        const dash = dashjs.MediaPlayer().create();
        dashPlayer = dash;
        let dashFailed = false;
        const failDashPlayback = () => {
            if (token !== loadToken || dashFailed)
                return;
            dashFailed = true;
            clearTimeout(dashStartupTimer);
            dashStartupTimer = undefined;
            errorMessage.value = t('player.videoCouldNotPlay');
            waiting.value = false;
            dash.reset();
            if (dashPlayer === dash)
                dashPlayer = undefined;
            emit('error', errorMessage.value);
        };
        dash.on(dashjs.MediaPlayer.events.STREAM_INITIALIZED, (event) => {
            if (token !== loadToken)
                return;
            if (event.error) {
                failDashPlayback();
            }
            else if (resume) {
                tryPlay();
            }
        });
        dash.on(dashjs.MediaPlayer.events.ERROR, (event) => {
            if (token !== loadToken)
                return;
            const fatalCodes = new Set([dashjs.MediaPlayer.errors.MANIFEST_LOADER_PARSING_FAILURE_ERROR_CODE, dashjs.MediaPlayer.errors.MANIFEST_LOADER_LOADING_FAILURE_ERROR_CODE, dashjs.MediaPlayer.errors.MANIFEST_ERROR_ID_PARSE_CODE, dashjs.MediaPlayer.errors.MANIFEST_ERROR_ID_NOSTREAMS_CODE, dashjs.MediaPlayer.errors.MEDIASOURCE_TYPE_UNSUPPORTED_CODE]);
            const requestFailed = event.error === 'download' && event.event.request.status >= 400;
            const fatalCode = typeof event.error === 'object' && 'code' in event.error && fatalCodes.has(event.error.code);
            if (requestFailed || event.error === 'manifestError' || fatalCode) {
                failDashPlayback();
            }
        });
        dashStartupTimer = setTimeout(() => {
            if (token !== loadToken || !waiting.value)
                return;
            failDashPlayback();
        }, DASH_START_TIMEOUT_MS);
        dash.initialize(el, props.streamUrl, false);
    }
    else if (props.live && Hls.isSupported()) {
        const hls = new Hls();
        hlsPlayer = hls;
        hls.on(Hls.Events.MEDIA_ATTACHED, () => hls.loadSource(props.streamUrl));
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
            if (token === loadToken && resume)
                tryPlay();
        });
        hls.on(Hls.Events.ERROR, (_event, data) => {
            if (!data.fatal || token !== loadToken)
                return;
            errorMessage.value = t('player.videoCouldNotPlay');
            waiting.value = false;
        });
        hls.attachMedia(el);
    }
    else if (props.live) {
        el.src = props.streamUrl;
    }
    else {
        el.src = useHls.value ? buildHlsUrl(props.streamUrl, { height: height.value || undefined, audioTrack }) : buildStreamUrl(props.streamUrl, { height: isNative.value ? undefined : height.value || undefined, start: isNative.value ? undefined : start, audioTrack });
    }
    if (resume && !(props.live && (props.container === 'mpd' || Hls.isSupported())))
        tryPlay();
    return true;
}
function isBuffered(el, time) {
    for (let i = 0; i < el.buffered.length; i++) {
        if (time >= el.buffered.start(i) && time <= el.buffered.end(i) - 0.3)
            return true;
    }
    return false;
}
let remoteChange = false;
function seekTo(target, manual = false) {
    const el = video.value;
    if (!el || (props.locked && !remoteChange))
        return;
    const max = duration.value > 0 ? Math.max(0, duration.value - 0.5) : target;
    const time = clamp(target, 0, max);
    if (manual) {
        for (const segment of props.segments) {
            if (!AUTO_SKIP_SEGMENT_TYPES.includes(segment.type))
                continue;
            const start = segment.startMs / 1000;
            const end = segment.endMs / 1000 - SEGMENT_END_GUARD_S;
            const countdownStart = start <= AUTO_SKIP_LEAD_SECONDS ? 0 : start - AUTO_SKIP_LEAD_SECONDS;
            if (time >= countdownStart && time < end)
                manualSkipPromptSegments.add(segmentKey(segment));
        }
    }
    const resume = !el.paused || ended.value;
    ended.value = false;
    if (isNative.value) {
        el.currentTime = time;
        current.value = time;
        return;
    }
    const local = time - offset.value;
    if (local >= 0 && isBuffered(el, local)) {
        el.currentTime = local;
        current.value = local;
        return;
    }
    loadSource({ start: time, resume });
}
function skip(seconds) {
    seekTo(position.value + seconds, true);
    showControls();
}
function setQuality(next) {
    menuOpen.value = false;
    if (next === height.value)
        return;
    loadSource({ height: next, start: position.value, resume: !paused.value });
}
async function setAudioTrack(index) {
    if (selectedAudioTrackIndex.value === index) {
        menuOpen.value = false;
        return;
    }
    const previous = selectedAudioTrackIndex.value;
    selectedAudioTrackIndex.value = index;
    menuOpen.value = false;
    if (!(await loadSource({ start: position.value, resume: !paused.value }))) {
        selectedAudioTrackIndex.value = previous;
    }
}
function togglePlay() {
    const el = video.value;
    if (!el || (props.locked && !remoteChange))
        return;
    if (ended.value) {
        seekTo(0);
        tryPlay();
        return;
    }
    if (el.paused)
        tryPlay();
    else
        el.pause();
}
function setVolume(value) {
    const el = video.value;
    if (!el)
        return;
    el.volume = clamp(value, 0, 1);
    el.muted = el.volume === 0;
}
function toggleMute() {
    const el = video.value;
    if (!el)
        return;
    if (el.muted || el.volume === 0) {
        el.muted = false;
        if (el.volume === 0)
            el.volume = 0.5;
    }
    else {
        el.muted = true;
    }
}
function onVolumeInput(event) {
    setVolume(Number(event.target.value));
}
async function toggleFullscreen() {
    if (document.fullscreenElement) {
        await document.exitFullscreen().catch(() => { });
        return;
    }
    if (root.value?.requestFullscreen) {
        await root.value.requestFullscreen().catch(() => { });
        void screen.orientation?.lock?.('landscape').catch(() => { });
    }
    else {
        // iOS Safari only supports fullscreen on the video element itself.
        ;
        video.value?.webkitEnterFullscreen?.();
    }
}
async function togglePip() {
    const el = video.value;
    if (!el)
        return;
    let request;
    try {
        request = document.pictureInPictureElement ? document.exitPictureInPicture() : el.requestPictureInPicture();
    }
    catch {
        return;
    }
    await catchError(request);
}
function onEnterPip() {
    isPip.value = true;
}
function onLeavePip() {
    isPip.value = false;
}
function onFullscreenChange() {
    isFullscreen.value = document.fullscreenElement === root.value;
    if (!isFullscreen.value)
        screen.orientation?.unlock?.();
}
function updateBuffered() {
    const el = video.value;
    if (!el)
        return;
    let end = el.currentTime;
    for (let i = 0; i < el.buffered.length; i++) {
        if (el.currentTime >= el.buffered.start(i) - 0.5 && el.currentTime <= el.buffered.end(i) + 0.5) {
            end = el.buffered.end(i);
        }
    }
    bufferedEnd.value = (isNative.value ? 0 : offset.value) + end;
}
function sync() {
    const el = video.value;
    if (!el)
        return;
    current.value = el.currentTime;
    updateBuffered();
}
function loop() {
    sync();
    frame = requestAnimationFrame(loop);
}
function startLoop() {
    if (!frame)
        frame = requestAnimationFrame(loop);
}
function stopLoop() {
    cancelAnimationFrame(frame);
    frame = 0;
}
function emitControl(action) {
    const now = performance.now();
    if (remotePlaybackTarget !== null && now < remotePlaybackUntil) {
        const matchesRemoteState = remotePlaybackTarget === (action === 'play');
        remotePlaybackTarget = null;
        if (matchesRemoteState)
            return;
    }
    if (action === 'seek' && remoteSeekTarget !== null && now < remoteSeekUntil) {
        const matchesRemotePosition = Math.abs(position.value - remoteSeekTarget) < 1;
        remoteSeekTarget = null;
        if (matchesRemotePosition)
            return;
    }
    emit('control', { action, playing: !paused.value, position: position.value });
}
function onSeeked() {
    sync();
    emitControl('seek');
}
function getState() {
    return { playing: !paused.value && !ended.value, position: position.value };
}
/** Moves this player to where the host is. Small drifts are left alone so playback doesn't stutter. */
function applyRemote(state) {
    const el = video.value;
    if (!el)
        return;
    remoteChange = true;
    try {
        const target = duration.value > 0 ? Math.min(state.position, Math.max(0, duration.value - 0.5)) : state.position;
        const drift = target - position.value;
        const absoluteDrift = Math.abs(drift);
        if (isNative.value) {
            if (absoluteDrift > REMOTE_DRIFT_S) {
                remoteSeekTarget = target;
                remoteSeekUntil = performance.now() + 10_000;
                seekTo(target);
            }
        }
        else if (!waiting.value && absoluteDrift >= REMOTE_DRIFT_SEEK_S) {
            const local = target - offset.value;
            const canSeek = local >= 0 && isBuffered(el, local);
            const shouldReload = absoluteDrift >= REMOTE_DRIFT_RELOAD_S && Date.now() - lastRemoteReload > REMOTE_RELOAD_COOLDOWN_MS;
            if (canSeek || shouldReload) {
                if (!canSeek)
                    lastRemoteReload = Date.now();
                remoteSeekTarget = target;
                remoteSeekUntil = performance.now() + 10_000;
                seekTo(target);
            }
            else {
                el.playbackRate = Math.max(0.97, Math.min(1.03, 1 + drift * 0.03));
            }
        }
        else if (!waiting.value && absoluteDrift >= REMOTE_DRIFT_IGNORE_S) {
            el.playbackRate = Math.max(0.97, Math.min(1.03, 1 + drift * 0.03));
        }
        else {
            el.playbackRate = 1;
        }
        if (waiting.value)
            return;
        if (state.playing && el.paused) {
            remotePlaybackTarget = true;
            remotePlaybackUntil = performance.now() + 10_000;
            tryPlay();
        }
        else if (!state.playing && !el.paused) {
            remotePlaybackTarget = false;
            remotePlaybackUntil = performance.now() + 10_000;
            el.pause();
        }
        if (!state.playing)
            el.playbackRate = 1;
    }
    finally {
        remoteChange = false;
    }
}
const __VLS_exposed = { getState, applyRemote };
defineExpose(__VLS_exposed);
function onPlay() {
    paused.value = false;
    ended.value = false;
    startLoop();
    scheduleHide();
    progressTimer ??= setInterval(reportProgress, PROGRESS_INTERVAL_MS);
    emitControl('play');
}
function stopProgressTimer() {
    clearInterval(progressTimer);
    progressTimer = undefined;
}
function reportProgress() {
    const total = duration.value;
    if (total <= 0)
        return;
    emit('progress', ended.value ? total : isNative.value ? current.value : offset.value + current.value, total);
}
function onPause() {
    paused.value = true;
    stopLoop();
    sync();
    showControls();
    stopProgressTimer();
    reportProgress();
    emitControl('pause');
}
const NEXT_COUNTDOWN_SECONDS = 15;
const nextCountdown = computed(() => {
    if (!props.nextLabel || duration.value <= 0)
        return null;
    if (ended.value)
        return 0;
    const remaining = duration.value - position.value;
    return position.value > 0 && remaining <= NEXT_COUNTDOWN_SECONDS ? Math.max(0, Math.ceil(remaining)) : null;
});
function onEnded() {
    ended.value = true;
    paused.value = true;
    stopLoop();
    sync();
    stopProgressTimer();
    reportProgress();
    emitControl('pause');
    if (props.nextLabel)
        emit('next');
    else
        emit('back');
}
function onLoadedMetadata() {
    const el = video.value;
    if (!el)
        return;
    nativeDuration.value = el.duration;
    if (nativeStart > 0 && isNative.value) {
        el.currentTime = nativeStart;
        nativeStart = 0;
    }
}
function onVolumeChange() {
    const el = video.value;
    if (!el)
        return;
    volume.value = el.volume;
    muted.value = el.muted;
    try {
        localStorage.setItem(VOLUME_KEY, JSON.stringify({ volume: el.volume, muted: el.muted }));
    }
    catch {
        // Storage can be unavailable (private mode); volume just won't persist.
    }
}
function onVideoError() {
    const el = video.value;
    if (!el || (!el.getAttribute('src') && !dashPlayer))
        return;
    errorMessage.value = mode.value === 'DirectPlay' ? t('player.videoCouldNotPlay') : t('player.streamStoppedUnexpectedly');
    clearTimeout(dashStartupTimer);
    dashStartupTimer = undefined;
    waiting.value = false;
    emit('error', errorMessage.value);
}
function onPlaybackReady() {
    clearTimeout(dashStartupTimer);
    dashStartupTimer = undefined;
    waiting.value = false;
}
function retry() {
    loadSource({ start: position.value, resume: true });
}
function showControls() {
    controlsVisible.value = true;
    scheduleHide();
}
function scheduleHide() {
    clearTimeout(hideTimer);
    if (paused.value || menuOpen.value || scrubbing.value)
        return;
    hideTimer = setTimeout(() => {
        controlsVisible.value = false;
    }, HIDE_DELAY_MS);
}
function onPointerDown(event) {
    lastPointerType = event.pointerType;
}
function onPointerMove(event) {
    if (event.pointerType === 'mouse')
        showControls();
}
function onPointerLeave(event) {
    if (event.pointerType === 'mouse' && !paused.value && !menuOpen.value)
        controlsVisible.value = false;
}
function releaseFocus(event) {
    ;
    event.target.closest('button')?.blur();
}
function onSurfaceClick() {
    if (menuOpen.value) {
        menuOpen.value = false;
        return;
    }
    if (lastPointerType === 'touch' && !controlsVisible.value) {
        showControls();
        return;
    }
    togglePlay();
    showControls();
}
function timeFromPointer(event) {
    const rect = bar.value.getBoundingClientRect();
    return clamp((event.clientX - rect.left) / rect.width, 0, 1) * duration.value;
}
function onBarDown(event) {
    if (duration.value <= 0)
        return;
    bar.value.setPointerCapture(event.pointerId);
    scrubbing.value = true;
    scrubTime.value = timeFromPointer(event);
    hoverTime.value = scrubTime.value;
}
function onBarMove(event) {
    if (duration.value <= 0)
        return;
    const time = timeFromPointer(event);
    hoverTime.value = time;
    warmTrickplay();
    if (scrubbing.value)
        scrubTime.value = time;
}
function onBarUp(event) {
    if (!scrubbing.value)
        return;
    scrubbing.value = false;
    seekTo(timeFromPointer(event), true);
    if (event.pointerType !== 'mouse')
        hoverTime.value = null;
    scheduleHide();
}
function onBarCancel() {
    scrubbing.value = false;
    hoverTime.value = null;
}
function onBarLeave() {
    if (!scrubbing.value)
        hoverTime.value = null;
}
function onKeydown(event) {
    const target = event.target;
    if (target && ['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName))
        return;
    if (target?.tagName === 'BUTTON' && (event.key === ' ' || event.key === 'Enter'))
        return;
    if (event.ctrlKey || event.metaKey || event.altKey)
        return;
    const el = video.value;
    if (!el)
        return;
    let handled = true;
    switch (event.key) {
        case ' ':
        case 'k':
            togglePlay();
            break;
        case 'ArrowLeft':
        case 'j':
            skip(-SKIP_SECONDS);
            break;
        case 'ArrowRight':
        case 'l':
            skip(SKIP_SECONDS);
            break;
        case 'ArrowUp':
            setVolume(el.volume + 0.05);
            break;
        case 'ArrowDown':
            setVolume(el.volume - 0.05);
            break;
        case 'm':
            toggleMute();
            break;
        case 'f':
            void toggleFullscreen();
            break;
        case 'p':
            if (pipSupported)
                void togglePip();
            break;
        case 'Home':
            seekTo(0, true);
            break;
        case 'Escape':
            if (menuOpen.value)
                menuOpen.value = false;
            else
                handled = false;
            break;
        default:
            if (/^[0-9]$/.test(event.key))
                seekTo((Number(event.key) / 10) * duration.value, true);
            else
                handled = false;
    }
    if (handled) {
        event.preventDefault();
        showControls();
    }
}
watch(menuOpen, () => {
    if (menuOpen.value)
        clearTimeout(hideTimer);
    else
        scheduleHide();
});
watch(() => props.streamUrl, () => {
    height.value = 0;
    loadSource({ start: 0, resume: props.autoplay });
    void loadSubtitleTracks();
    void loadTrickplay();
});
onMounted(() => {
    try {
        const saved = JSON.parse(localStorage.getItem(VOLUME_KEY) ?? 'null');
        if (saved && video.value) {
            video.value.volume = clamp(saved.volume, 0, 1);
            video.value.muted = saved.muted;
        }
    }
    catch {
        // Ignore corrupt saved settings.
    }
    volume.value = video.value?.volume ?? 1;
    muted.value = video.value?.muted ?? false;
    window.addEventListener('keydown', onKeydown);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    suppressInitialSkipCountdown(props.startAt);
    loadSource({ start: props.startAt, resume: props.autoplay });
    void loadSubtitleTracks();
    void loadTrickplay();
});
onBeforeUnmount(() => {
    clearTimeout(hideTimer);
    clearTimeout(dashStartupTimer);
    stopProgressTimer();
    if (!ended.value && !waiting.value)
        reportProgress();
    stopLoop();
    window.removeEventListener('keydown', onKeydown);
    document.removeEventListener('fullscreenchange', onFullscreenChange);
    if (document.fullscreenElement === root.value)
        void document.exitFullscreen().catch(() => { });
    if (document.pictureInPictureElement === video.value)
        void document.exitPictureInPicture().catch(() => { });
    hlsPlayer?.destroy();
    hlsPlayer = undefined;
    dashPlayer?.reset();
    dashPlayer = undefined;
    // Dropping the source closes the connection so flixer-streamer stops ffmpeg.
    video.value?.removeAttribute('src');
    video.value?.load();
});
const __VLS_defaults = { autoplay: true, showBack: false, allowMini: false, liveGuideOpen: false, mini: false, startAt: 0, chapters: () => [], segments: () => [], autoSkipIntroCredits: true, defaultAudioLanguage: '', container: 'm3u8' };
void __VLS_defaults;
const __VLS_ctx = {
    ...{},
    ...{},
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
void __VLS_ctx, __VLS_components, __VLS_intrinsics, __VLS_directives;
const __VLS_template = () => {
    __VLS_withDotValue(controlsShown, {});
    __VLS_withDotValue(partyState, {});
    __VLS_withDotValue(inVideoParty, {});
    __VLS_withDotValue(waiting, {});
    __VLS_withDotValue(subtitleText, {});
    __VLS_withDotValue(errorMessage, {});
    __VLS_withDotValue(showCenterPlay, {});
    __VLS_withDotValue(ended, {});
    __VLS_withDotValue(paused, {});
    __VLS_withDotValue(nextCountdown, {});
    __VLS_withDotValue(skipButtonSegment, {});
    __VLS_withDotValue(autoSkipCountdown, {});
    __VLS_withDotValue(partyMenuOpen, {});
    __VLS_withDotValue(menuOpen, {});
    __VLS_withDotValue(audioTrackOptions, {});
    __VLS_withDotValue(selectedAudioTrackIndex, {});
    __VLS_withDotValue(subtitleTracks, {});
    __VLS_withDotValue(subtitleId, {});
    __VLS_withDotValue(autoSkip, {});
    __VLS_withDotValue(height, {});
    __VLS_withDotValue(METHOD_LABELS, {});
    __VLS_withDotValue(scrubbing, {});
    __VLS_withDotValue(hoverTime, {});
    __VLS_withDotValue(hoverThumb, {});
    __VLS_withDotValue(hoverChapter, {});
    __VLS_withDotValue(muted, {});
    __VLS_withDotValue(volume, {});
    __VLS_withDotValue(mode, {});
    __VLS_withDotValue(pipSupported, {});
    __VLS_withDotValue(isPip, {});
    __VLS_withDotValue(isFullscreen, {});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onPointerdown: (onPointerDown) },
        ...{ onPointermove: (onPointerMove) },
        ...{ onPointerleave: (onPointerLeave) },
        ref: "root",
        'data-haptic': true,
        ...{ class: "relative size-full select-none overflow-hidden bg-black font-sans text-flixer-text" },
        ...{ class: ({ 'cursor-none': !controlsShown.value && !(partyState.value.chatOpen.value && inVideoParty.value) }) },
    });
    /** @type {__VLS_StyleScopedClasses['relative']} */ ;
    /** @type {__VLS_StyleScopedClasses['size-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['select-none']} */ ;
    /** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-black']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-sans']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-text']} */ ;
    /** @type {__VLS_StyleScopedClasses['cursor-none']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.video)({
        ...{ onClick: (onSurfaceClick) },
        ...{ onDblclick: (toggleFullscreen) },
        ...{ onPlay: (onPlay) },
        ...{ onPause: (onPause) },
        ...{ onSeeked: (onSeeked) },
        ...{ onEnded: (onEnded) },
        ...{ onWaiting: (...[$event]) => {
                void $event;
                return (waiting.value = true);
                // @ts-ignore
                [controlsShown, partyState, inVideoParty, waiting,];
            } },
        ...{ onPlaying: (onPlaybackReady) },
        ...{ onCanplay: (onPlaybackReady) },
        ...{ onTimeupdate: (sync) },
        ...{ onProgress: (updateBuffered) },
        ...{ onLoadedmetadata: (onLoadedMetadata) },
        ...{ onVolumechange: (onVolumeChange) },
        ...{ onEnterpictureinpicture: (onEnterPip) },
        ...{ onLeavepictureinpicture: (onLeavePip) },
        ...{ onError: (onVideoError) },
        ref: "video",
        ...{ class: "size-full bg-black object-contain" },
        preload: "auto",
        playsinline: true,
    });
    /** @type {__VLS_StyleScopedClasses['size-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-black']} */ ;
    /** @type {__VLS_StyleScopedClasses['object-contain']} */ ;
    if (subtitleText.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "pointer-events-none absolute inset-x-0 flex justify-center px-4 transition-all duration-300" },
            ...{ class: (controlsShown.value ? 'bottom-24' : 'bottom-8') },
            'aria-live': "off",
        });
        /** @type {__VLS_StyleScopedClasses['pointer-events-none']} */ ;
        /** @type {__VLS_StyleScopedClasses['absolute']} */ ;
        /** @type {__VLS_StyleScopedClasses['inset-x-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition-all']} */ ;
        /** @type {__VLS_StyleScopedClasses['duration-300']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "theme-dark max-w-3xl whitespace-pre-line rounded bg-black/65 px-3 py-1 text-center text-base font-medium leading-snug text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.9)] sm:text-xl" },
        });
        /** @type {__VLS_StyleScopedClasses['theme-dark']} */ ;
        /** @type {__VLS_StyleScopedClasses['max-w-3xl']} */ ;
        /** @type {__VLS_StyleScopedClasses['whitespace-pre-line']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-black/65']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-base']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
        /** @type {__VLS_StyleScopedClasses['leading-snug']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
        /** @type {__VLS_StyleScopedClasses['[text-shadow:0_1px_2px_rgba(0,0,0,0.9)]']} */ ;
        /** @type {__VLS_StyleScopedClasses['sm:text-xl']} */ ;
        (subtitleText.value);
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "pointer-events-none absolute inset-0 grid place-items-center" },
    });
    /** @type {__VLS_StyleScopedClasses['pointer-events-none']} */ ;
    /** @type {__VLS_StyleScopedClasses['absolute']} */ ;
    /** @type {__VLS_StyleScopedClasses['inset-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['grid']} */ ;
    /** @type {__VLS_StyleScopedClasses['place-items-center']} */ ;
    if (waiting.value && !errorMessage.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "size-14 animate-spin rounded-full border-4 border-white/20 border-t-flixer-accent" },
            role: "status",
            'aria-label': (__VLS_unwrap(t, {})('player.buffering')),
        });
        /** @type {__VLS_StyleScopedClasses['size-14']} */ ;
        /** @type {__VLS_StyleScopedClasses['animate-spin']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-white/20']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-t-flixer-accent']} */ ;
    }
    else if (errorMessage.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "pointer-events-auto max-w-sm px-6 text-center" },
            role: "alert",
        });
        /** @type {__VLS_StyleScopedClasses['pointer-events-auto']} */ ;
        /** @type {__VLS_StyleScopedClasses['max-w-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-6']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "text-sm text-red-300" },
        });
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-red-300']} */ ;
        (errorMessage.value);
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (retry) },
            type: "button",
            ...{ class: "mt-4 rounded bg-flixer-primary px-5 py-2 text-sm font-semibold text-white transition hover:bg-flixer-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-flixer-primary']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-5']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-flixer-secondary']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:outline-offset-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
        (__VLS_unwrap(t, {})('player.tryAgain'));
    }
    else if (showCenterPlay.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (togglePlay) },
            type: "button",
            ...{ class: "pointer-events-auto grid size-20 place-items-center rounded bg-flixer-primary/90 text-white shadow-2xl shadow-black/60 transition hover:scale-105 hover:bg-flixer-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent" },
            'aria-label': (ended.value ? __VLS_unwrap(t, {})('player.replay') : __VLS_unwrap(t, {})('player.play')),
        });
        /** @type {__VLS_StyleScopedClasses['pointer-events-auto']} */ ;
        /** @type {__VLS_StyleScopedClasses['grid']} */ ;
        /** @type {__VLS_StyleScopedClasses['size-20']} */ ;
        /** @type {__VLS_StyleScopedClasses['place-items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-flixer-primary/90']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
        /** @type {__VLS_StyleScopedClasses['shadow-2xl']} */ ;
        /** @type {__VLS_StyleScopedClasses['shadow-black/60']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:scale-105']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-flixer-primary']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:outline-offset-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
        if (ended.value) {
            let __VLS_0;
            /** @ts-ignore @type { | typeof __VLS_components.Icon} */
            Icon;
            // @ts-ignore
            const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
                // @ts-ignore
                icon: "lucide:rotate-ccw", ...{ class: "size-9" }, 'aria-hidden': "true",
            }));
            const __VLS_2 = __VLS_1({
                icon: "lucide:rotate-ccw",
                ...{ class: "size-9" },
                'aria-hidden': "true",
            }, ...__VLS_functionalComponentArgsRest(__VLS_1));
            /** @type {__VLS_StyleScopedClasses['size-9']} */ ;
        }
        else {
            let __VLS_5;
            /** @ts-ignore @type { | typeof __VLS_components.Icon} */
            Icon;
            // @ts-ignore
            const __VLS_6 = __VLS_asFunctionalComponent1(__VLS_5, new __VLS_5({
                // @ts-ignore
                icon: "lucide:play", ...{ class: "ml-1 size-9" }, 'aria-hidden': "true",
            }));
            const __VLS_7 = __VLS_6({
                icon: "lucide:play",
                ...{ class: "ml-1 size-9" },
                'aria-hidden': "true",
            }, ...__VLS_functionalComponentArgsRest(__VLS_6));
            /** @type {__VLS_StyleScopedClasses['ml-1']} */ ;
            /** @type {__VLS_StyleScopedClasses['size-9']} */ ;
        }
    }
    if (__VLS_ctx.mini) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ onClick: (togglePlay) },
            ...{ class: "absolute inset-0 flex flex-col justify-between bg-black/0 opacity-0 transition-opacity focus-within:bg-black/40 focus-within:opacity-100 hover:bg-black/40 hover:opacity-100" },
        });
        /** @type {__VLS_StyleScopedClasses['absolute']} */ ;
        /** @type {__VLS_StyleScopedClasses['inset-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
        /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-black/0']} */ ;
        /** @type {__VLS_StyleScopedClasses['opacity-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition-opacity']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-within:bg-black/40']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-within:opacity-100']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-black/40']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:opacity-100']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "flex justify-end gap-1 p-1" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['justify-end']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['p-1']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    void $event;
                    if (!(__VLS_ctx.mini))
                        throw 0;
                    return (__VLS_unwrap(emit, {})('toggle-mini'));
                    // @ts-ignore
                    [controlsShown, waiting, subtitleText, subtitleText, errorMessage, errorMessage, errorMessage, t, t, t, t, showCenterPlay, ended, ended, mini, emit,];
                } },
            type: "button",
            ...{ class: "grid size-8 place-items-center rounded text-white hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-flixer-accent" },
            'aria-label': (__VLS_unwrap(t, {})('player.expand')),
        });
        /** @type {__VLS_StyleScopedClasses['grid']} */ ;
        /** @type {__VLS_StyleScopedClasses['size-8']} */ ;
        /** @type {__VLS_StyleScopedClasses['place-items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-white/20']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
        let __VLS_10;
        /** @ts-ignore @type { | typeof __VLS_components.Icon} */
        Icon;
        // @ts-ignore
        const __VLS_11 = __VLS_asFunctionalComponent1(__VLS_10, new __VLS_10({
            // @ts-ignore
            icon: "lucide:maximize", ...{ class: "size-5" }, 'aria-hidden': "true",
        }));
        const __VLS_12 = __VLS_11({
            icon: "lucide:maximize",
            ...{ class: "size-5" },
            'aria-hidden': "true",
        }, ...__VLS_functionalComponentArgsRest(__VLS_11));
        /** @type {__VLS_StyleScopedClasses['size-5']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    void $event;
                    if (!(__VLS_ctx.mini))
                        throw 0;
                    return (__VLS_unwrap(emit, {})('back'));
                    // @ts-ignore
                    [t, emit,];
                } },
            type: "button",
            ...{ class: "grid size-8 place-items-center rounded text-white hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-flixer-accent" },
            'aria-label': (__VLS_unwrap(t, {})('player.closePlayer')),
        });
        /** @type {__VLS_StyleScopedClasses['grid']} */ ;
        /** @type {__VLS_StyleScopedClasses['size-8']} */ ;
        /** @type {__VLS_StyleScopedClasses['place-items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-white/20']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
        let __VLS_15;
        /** @ts-ignore @type { | typeof __VLS_components.Icon} */
        Icon;
        // @ts-ignore
        const __VLS_16 = __VLS_asFunctionalComponent1(__VLS_15, new __VLS_15({
            // @ts-ignore
            icon: "lucide:x", ...{ class: "size-5" }, 'aria-hidden': "true",
        }));
        const __VLS_17 = __VLS_16({
            icon: "lucide:x",
            ...{ class: "size-5" },
            'aria-hidden': "true",
        }, ...__VLS_functionalComponentArgsRest(__VLS_16));
        /** @type {__VLS_StyleScopedClasses['size-5']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "flex justify-center p-2" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['p-2']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (togglePlay) },
            type: "button",
            ...{ class: "grid size-10 place-items-center rounded-full bg-black/60 text-white hover:bg-black/80 focus-visible:outline-2 focus-visible:outline-flixer-accent" },
            'aria-label': (paused.value ? __VLS_unwrap(t, {})('player.play') : __VLS_unwrap(t, {})('player.pause')),
        });
        /** @type {__VLS_StyleScopedClasses['grid']} */ ;
        /** @type {__VLS_StyleScopedClasses['size-10']} */ ;
        /** @type {__VLS_StyleScopedClasses['place-items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-black/60']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-black/80']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
        if (paused.value) {
            let __VLS_20;
            /** @ts-ignore @type { | typeof __VLS_components.Icon} */
            Icon;
            // @ts-ignore
            const __VLS_21 = __VLS_asFunctionalComponent1(__VLS_20, new __VLS_20({
                // @ts-ignore
                icon: "lucide:play", ...{ class: "ml-0.5 size-5" }, 'aria-hidden': "true",
            }));
            const __VLS_22 = __VLS_21({
                icon: "lucide:play",
                ...{ class: "ml-0.5 size-5" },
                'aria-hidden': "true",
            }, ...__VLS_functionalComponentArgsRest(__VLS_21));
            /** @type {__VLS_StyleScopedClasses['ml-0.5']} */ ;
            /** @type {__VLS_StyleScopedClasses['size-5']} */ ;
        }
        else {
            let __VLS_25;
            /** @ts-ignore @type { | typeof __VLS_components.Icon} */
            Icon;
            // @ts-ignore
            const __VLS_26 = __VLS_asFunctionalComponent1(__VLS_25, new __VLS_25({
                // @ts-ignore
                icon: "lucide:pause", ...{ class: "size-5" }, 'aria-hidden': "true",
            }));
            const __VLS_27 = __VLS_26({
                icon: "lucide:pause",
                ...{ class: "size-5" },
                'aria-hidden': "true",
            }, ...__VLS_functionalComponentArgsRest(__VLS_26));
            /** @type {__VLS_StyleScopedClasses['size-5']} */ ;
        }
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onPointerup: (releaseFocus) },
        ...{ class: "absolute inset-x-0 top-0 flex items-center gap-3 bg-gradient-to-b from-black/80 to-transparent px-4 pb-10 pt-4 transition-opacity duration-300 sm:px-6" },
        ...{ class: (controlsShown.value ? 'opacity-100' : 'pointer-events-none opacity-0') },
    });
    /** @type {__VLS_StyleScopedClasses['absolute']} */ ;
    /** @type {__VLS_StyleScopedClasses['inset-x-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['top-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-gradient-to-b']} */ ;
    /** @type {__VLS_StyleScopedClasses['from-black/80']} */ ;
    /** @type {__VLS_StyleScopedClasses['to-transparent']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['pb-10']} */ ;
    /** @type {__VLS_StyleScopedClasses['pt-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['transition-opacity']} */ ;
    /** @type {__VLS_StyleScopedClasses['duration-300']} */ ;
    /** @type {__VLS_StyleScopedClasses['sm:px-6']} */ ;
    if (__VLS_ctx.showBack) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    void $event;
                    if (!(__VLS_ctx.showBack))
                        throw 0;
                    return (__VLS_ctx.allowMini ? __VLS_unwrap(emit, {})('toggle-mini') : __VLS_unwrap(emit, {})('back'));
                    // @ts-ignore
                    [controlsShown, t, t, t, emit, emit, paused, paused, showBack, allowMini,];
                } },
            type: "button",
            ...{ class: "grid size-10 place-items-center rounded text-white/90 transition hover:bg-white/15 hover:text-white focus-visible:outline-2 focus-visible:outline-flixer-accent" },
            'aria-label': (__VLS_ctx.allowMini ? __VLS_unwrap(t, {})('player.miniPlayer') : __VLS_unwrap(t, {})('player.back')),
            title: (__VLS_ctx.allowMini ? __VLS_unwrap(t, {})('player.miniPlayer') : undefined),
        });
        /** @type {__VLS_StyleScopedClasses['grid']} */ ;
        /** @type {__VLS_StyleScopedClasses['size-10']} */ ;
        /** @type {__VLS_StyleScopedClasses['place-items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-white/90']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-white/15']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:text-white']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
        let __VLS_30;
        /** @ts-ignore @type { | typeof __VLS_components.Icon} */
        Icon;
        // @ts-ignore
        const __VLS_31 = __VLS_asFunctionalComponent1(__VLS_30, new __VLS_30({
            // @ts-ignore
            icon: "lucide:arrow-left", ...{ class: "size-6" }, 'aria-hidden': "true",
        }));
        const __VLS_32 = __VLS_31({
            icon: "lucide:arrow-left",
            ...{ class: "size-6" },
            'aria-hidden': "true",
        }, ...__VLS_functionalComponentArgsRest(__VLS_31));
        /** @type {__VLS_StyleScopedClasses['size-6']} */ ;
    }
    if (__VLS_ctx.title) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({
            ...{ class: "truncate text-base font-semibold tracking-tight sm:text-lg" },
        });
        /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-base']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['tracking-tight']} */ ;
        /** @type {__VLS_StyleScopedClasses['sm:text-lg']} */ ;
        (__VLS_ctx.title);
    }
    if (nextCountdown.value !== null && !__VLS_ctx.mini) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    void $event;
                    if (!(nextCountdown.value !== null && !__VLS_ctx.mini))
                        throw 0;
                    return (__VLS_unwrap(emit, {})('next'));
                    // @ts-ignore
                    [t, t, t, mini, emit, allowMini, allowMini, title, title, nextCountdown,];
                } },
            type: "button",
            ...{ class: "absolute bottom-28 right-4 z-10 max-w-[70%] rounded border border-white/40 bg-black/70 px-5 py-2.5 text-left text-sm font-semibold text-white shadow-lg shadow-black/50 backdrop-blur transition hover:bg-white hover:text-black focus-visible:outline-2 focus-visible:outline-flixer-accent sm:right-8" },
            ...{ class: (skipButtonSegment.value ? 'bottom-44' : '') },
        });
        /** @type {__VLS_StyleScopedClasses['absolute']} */ ;
        /** @type {__VLS_StyleScopedClasses['bottom-28']} */ ;
        /** @type {__VLS_StyleScopedClasses['right-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['z-10']} */ ;
        /** @type {__VLS_StyleScopedClasses['max-w-[70%]']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-white/40']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-black/70']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-5']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-2.5']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-left']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
        /** @type {__VLS_StyleScopedClasses['shadow-lg']} */ ;
        /** @type {__VLS_StyleScopedClasses['shadow-black/50']} */ ;
        /** @type {__VLS_StyleScopedClasses['backdrop-blur']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-white']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:text-black']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
        /** @type {__VLS_StyleScopedClasses['sm:right-8']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "block text-xs font-normal opacity-80" },
        });
        /** @type {__VLS_StyleScopedClasses['block']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-normal']} */ ;
        /** @type {__VLS_StyleScopedClasses['opacity-80']} */ ;
        (__VLS_unwrap(t, {})('player.nextEpisodeIn', { seconds: nextCountdown.value }));
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "block truncate" },
        });
        /** @type {__VLS_StyleScopedClasses['block']} */ ;
        /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
        (__VLS_ctx.nextLabel);
    }
    if (skipButtonSegment.value && !__VLS_ctx.mini) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    void $event;
                    if (!(skipButtonSegment.value && !__VLS_ctx.mini))
                        throw 0;
                    return (skipSegment(skipButtonSegment.value));
                    // @ts-ignore
                    [t, mini, nextCountdown, skipButtonSegment, skipButtonSegment, skipButtonSegment, nextLabel,];
                } },
            type: "button",
            ...{ class: "absolute bottom-28 right-4 z-10 flex items-center gap-4 rounded border border-white/40 bg-black/70 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-black/50 backdrop-blur transition hover:bg-white hover:text-black focus-visible:outline-2 focus-visible:outline-flixer-accent sm:right-8" },
        });
        /** @type {__VLS_StyleScopedClasses['absolute']} */ ;
        /** @type {__VLS_StyleScopedClasses['bottom-28']} */ ;
        /** @type {__VLS_StyleScopedClasses['right-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['z-10']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-white/40']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-black/70']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-5']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-2.5']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
        /** @type {__VLS_StyleScopedClasses['shadow-lg']} */ ;
        /** @type {__VLS_StyleScopedClasses['shadow-black/50']} */ ;
        /** @type {__VLS_StyleScopedClasses['backdrop-blur']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-white']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:text-black']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
        /** @type {__VLS_StyleScopedClasses['sm:right-8']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (__VLS_unwrap(t, {})(`player.skip.${skipButtonSegment.value.type}`));
        if (autoSkipCountdown.value !== null) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "text-base font-bold tabular-nums" },
                'aria-label': (__VLS_unwrap(t, {})('player.skipCountdown', { seconds: autoSkipCountdown.value })),
                'aria-live': "off",
            });
            /** @type {__VLS_StyleScopedClasses['text-base']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
            /** @type {__VLS_StyleScopedClasses['tabular-nums']} */ ;
            (autoSkipCountdown.value);
        }
    }
    if (partyState.value.chatOpen.value && inVideoParty.value && !__VLS_ctx.mini) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "absolute bottom-24 right-3 top-16 z-20 w-80 max-w-[calc(100%-1.5rem)] overflow-hidden rounded border border-flixer-border bg-flixer-surface/95 text-flixer-text shadow-2xl shadow-black/60 backdrop-blur sm:right-6" },
        });
        /** @type {__VLS_StyleScopedClasses['absolute']} */ ;
        /** @type {__VLS_StyleScopedClasses['bottom-24']} */ ;
        /** @type {__VLS_StyleScopedClasses['right-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['top-16']} */ ;
        /** @type {__VLS_StyleScopedClasses['z-20']} */ ;
        /** @type {__VLS_StyleScopedClasses['w-80']} */ ;
        /** @type {__VLS_StyleScopedClasses['max-w-[calc(100%-1.5rem)]']} */ ;
        /** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-flixer-surface/95']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-text']} */ ;
        /** @type {__VLS_StyleScopedClasses['shadow-2xl']} */ ;
        /** @type {__VLS_StyleScopedClasses['shadow-black/60']} */ ;
        /** @type {__VLS_StyleScopedClasses['backdrop-blur']} */ ;
        /** @type {__VLS_StyleScopedClasses['sm:right-6']} */ ;
        const __VLS_35 = PartyChat;
        // @ts-ignore
        const __VLS_36 = __VLS_asFunctionalComponent1(__VLS_35, new __VLS_35({
            // @ts-ignore
            ...{ 'onClose': {} },
        }));
        const __VLS_37 = __VLS_36({
            ...{ 'onClose': {} },
        }, ...__VLS_functionalComponentArgsRest(__VLS_36));
        let __VLS_40;
        const __VLS_41 = {
            /** @type {typeof __VLS_40.close} */
            onClose: (...[$event]) => {
                void $event;
                if (!(partyState.value.chatOpen.value && inVideoParty.value && !__VLS_ctx.mini))
                    throw 0;
                return (partyState.value.setChatOpen(false));
                // @ts-ignore
                [partyState, partyState, inVideoParty, t, t, mini, skipButtonSegment, autoSkipCountdown, autoSkipCountdown, autoSkipCountdown,];
            },
        };
        void __VLS_41;
        var __VLS_38;
        var __VLS_39;
    }
    if (partyMenuOpen.value && inVideoParty.value && controlsShown.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "absolute bottom-20 right-3 z-20 max-h-[70%] w-64 overflow-y-auto rounded border border-flixer-border bg-flixer-surface/95 p-2 shadow-2xl shadow-black/60 backdrop-blur sm:right-6" },
            role: "dialog",
        });
        /** @type {__VLS_StyleScopedClasses['absolute']} */ ;
        /** @type {__VLS_StyleScopedClasses['bottom-20']} */ ;
        /** @type {__VLS_StyleScopedClasses['right-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['z-20']} */ ;
        /** @type {__VLS_StyleScopedClasses['max-h-[70%]']} */ ;
        /** @type {__VLS_StyleScopedClasses['w-64']} */ ;
        /** @type {__VLS_StyleScopedClasses['overflow-y-auto']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-flixer-surface/95']} */ ;
        /** @type {__VLS_StyleScopedClasses['p-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['shadow-2xl']} */ ;
        /** @type {__VLS_StyleScopedClasses['shadow-black/60']} */ ;
        /** @type {__VLS_StyleScopedClasses['backdrop-blur']} */ ;
        /** @type {__VLS_StyleScopedClasses['sm:right-6']} */ ;
        const __VLS_42 = PartyPanel;
        // @ts-ignore
        const __VLS_43 = __VLS_asFunctionalComponent1(__VLS_42, new __VLS_42({
            // @ts-ignore
            ...{ 'onLeft': {} },
        }));
        const __VLS_44 = __VLS_43({
            ...{ 'onLeft': {} },
        }, ...__VLS_functionalComponentArgsRest(__VLS_43));
        let __VLS_47;
        const __VLS_48 = {
            /** @type {typeof __VLS_47.left} */
            onLeft: (...[$event]) => {
                void $event;
                if (!(partyMenuOpen.value && inVideoParty.value && controlsShown.value))
                    throw 0;
                return (partyMenuOpen.value = false);
                // @ts-ignore
                [controlsShown, inVideoParty, partyMenuOpen, partyMenuOpen,];
            },
        };
        void __VLS_48;
        var __VLS_45;
        var __VLS_46;
    }
    if (menuOpen.value && controlsShown.value && !__VLS_ctx.live) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "absolute bottom-20 right-3 z-20 max-h-[70%] w-64 overflow-y-auto rounded border border-flixer-border bg-flixer-surface/95 p-2 shadow-2xl shadow-black/60 backdrop-blur sm:right-6" },
            role: "menu",
            'aria-label': (__VLS_unwrap(t, {})('player.playbackSettings')),
        });
        /** @type {__VLS_StyleScopedClasses['absolute']} */ ;
        /** @type {__VLS_StyleScopedClasses['bottom-20']} */ ;
        /** @type {__VLS_StyleScopedClasses['right-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['z-20']} */ ;
        /** @type {__VLS_StyleScopedClasses['max-h-[70%]']} */ ;
        /** @type {__VLS_StyleScopedClasses['w-64']} */ ;
        /** @type {__VLS_StyleScopedClasses['overflow-y-auto']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-flixer-surface/95']} */ ;
        /** @type {__VLS_StyleScopedClasses['p-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['shadow-2xl']} */ ;
        /** @type {__VLS_StyleScopedClasses['shadow-black/60']} */ ;
        /** @type {__VLS_StyleScopedClasses['backdrop-blur']} */ ;
        /** @type {__VLS_StyleScopedClasses['sm:right-6']} */ ;
        if (audioTrackOptions.value.length > 1) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['pb-1']} */ ;
            /** @type {__VLS_StyleScopedClasses['pt-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
            /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
            /** @type {__VLS_StyleScopedClasses['tracking-wide']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            (__VLS_unwrap(t, {})('player.audio'));
            const __VLS_49 = __VLS_tryAsConstant((audioTrackOptions.value));
            for (const [option] of __VLS_vFor(__VLS_nonNull(__VLS_49))) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                    ...{ onClick: (...[$event]) => {
                            void $event;
                            if (!(menuOpen.value && controlsShown.value && !__VLS_ctx.live))
                                throw 0;
                            if (!(audioTrackOptions.value.length > 1))
                                throw 0;
                            return (setAudioTrack(option.track.index));
                            // @ts-ignore
                            [controlsShown, t, t, menuOpen, live, audioTrackOptions, audioTrackOptions,];
                        } },
                    key: (option.track.index),
                    type: "button",
                    role: "menuitemradio",
                    'aria-checked': (selectedAudioTrackIndex.value === option.track.index),
                    ...{ class: "flex w-full items-center justify-between gap-3 rounded px-3 py-2 text-left text-sm transition hover:bg-white/10" },
                    ...{ class: (selectedAudioTrackIndex.value === option.track.index ? 'text-flixer-accent' : 'text-flixer-text') },
                });
                /** @type {__VLS_StyleScopedClasses['flex']} */ ;
                /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
                /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
                /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
                /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
                /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
                /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
                /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-left']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
                /** @type {__VLS_StyleScopedClasses['transition']} */ ;
                /** @type {__VLS_StyleScopedClasses['hover:bg-white/10']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "truncate" },
                });
                /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
                (option.label);
                if (selectedAudioTrackIndex.value === option.track.index) {
                    let __VLS_50;
                    /** @ts-ignore @type { | typeof __VLS_components.Icon} */
                    Icon;
                    // @ts-ignore
                    const __VLS_51 = __VLS_asFunctionalComponent1(__VLS_50, new __VLS_50({
                        // @ts-ignore
                        icon: "lucide:check", ...{ class: "size-4 shrink-0" }, 'aria-hidden': "true",
                    }));
                    const __VLS_52 = __VLS_51({
                        icon: "lucide:check",
                        ...{ class: "size-4 shrink-0" },
                        'aria-hidden': "true",
                    }, ...__VLS_functionalComponentArgsRest(__VLS_51));
                    /** @type {__VLS_StyleScopedClasses['size-4']} */ ;
                    /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
                }
                // @ts-ignore
                [selectedAudioTrackIndex, selectedAudioTrackIndex, selectedAudioTrackIndex,];
            }
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "my-2 border-t border-flixer-border" },
            });
            /** @type {__VLS_StyleScopedClasses['my-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-t']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['pb-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['pt-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
        /** @type {__VLS_StyleScopedClasses['tracking-wide']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (__VLS_unwrap(t, {})('player.subtitles'));
        if (subtitleTracks.value.length === 0) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "px-3 pb-2 text-sm text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['pb-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            (__VLS_unwrap(t, {})('player.subtitlesNone'));
        }
        else {
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        void $event;
                        if (!(menuOpen.value && controlsShown.value && !__VLS_ctx.live))
                            throw 0;
                        if (!!(subtitleTracks.value.length === 0))
                            throw 0;
                        return (selectSubtitle(''));
                        // @ts-ignore
                        [t, t, subtitleTracks,];
                    } },
                type: "button",
                role: "menuitemradio",
                'aria-checked': (subtitleId.value === ''),
                ...{ class: "flex w-full items-center justify-between rounded px-3 py-2 text-left text-sm transition hover:bg-white/10" },
                ...{ class: (subtitleId.value === '' ? 'text-flixer-accent' : 'text-flixer-text') },
            });
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-left']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['transition']} */ ;
            /** @type {__VLS_StyleScopedClasses['hover:bg-white/10']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            (__VLS_unwrap(t, {})('player.subtitlesOff'));
            if (subtitleId.value === '') {
                let __VLS_55;
                /** @ts-ignore @type { | typeof __VLS_components.Icon} */
                Icon;
                // @ts-ignore
                const __VLS_56 = __VLS_asFunctionalComponent1(__VLS_55, new __VLS_55({
                    // @ts-ignore
                    icon: "lucide:check", ...{ class: "size-4" }, 'aria-hidden': "true",
                }));
                const __VLS_57 = __VLS_56({
                    icon: "lucide:check",
                    ...{ class: "size-4" },
                    'aria-hidden': "true",
                }, ...__VLS_functionalComponentArgsRest(__VLS_56));
                /** @type {__VLS_StyleScopedClasses['size-4']} */ ;
            }
            const __VLS_60 = __VLS_tryAsConstant((subtitleTracks.value));
            for (const [track] of __VLS_vFor(__VLS_nonNull(__VLS_60))) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                    ...{ onClick: (...[$event]) => {
                            void $event;
                            if (!(menuOpen.value && controlsShown.value && !__VLS_ctx.live))
                                throw 0;
                            if (!!(subtitleTracks.value.length === 0))
                                throw 0;
                            return (selectSubtitle(track.id));
                            // @ts-ignore
                            [t, subtitleTracks, subtitleId, subtitleId, subtitleId,];
                        } },
                    key: (track.id),
                    type: "button",
                    role: "menuitemradio",
                    'aria-checked': (subtitleId.value === track.id),
                    ...{ class: "flex w-full items-center justify-between rounded px-3 py-2 text-left text-sm transition hover:bg-white/10" },
                    ...{ class: (subtitleId.value === track.id ? 'text-flixer-accent' : 'text-flixer-text') },
                });
                /** @type {__VLS_StyleScopedClasses['flex']} */ ;
                /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
                /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
                /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
                /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
                /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
                /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-left']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
                /** @type {__VLS_StyleScopedClasses['transition']} */ ;
                /** @type {__VLS_StyleScopedClasses['hover:bg-white/10']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "truncate" },
                });
                /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
                (subtitleLabel(track));
                if (subtitleId.value === track.id) {
                    let __VLS_61;
                    /** @ts-ignore @type { | typeof __VLS_components.Icon} */
                    Icon;
                    // @ts-ignore
                    const __VLS_62 = __VLS_asFunctionalComponent1(__VLS_61, new __VLS_61({
                        // @ts-ignore
                        icon: "lucide:check", ...{ class: "size-4 shrink-0" }, 'aria-hidden': "true",
                    }));
                    const __VLS_63 = __VLS_62({
                        icon: "lucide:check",
                        ...{ class: "size-4 shrink-0" },
                        'aria-hidden': "true",
                    }, ...__VLS_functionalComponentArgsRest(__VLS_62));
                    /** @type {__VLS_StyleScopedClasses['size-4']} */ ;
                    /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
                }
                // @ts-ignore
                [subtitleId, subtitleId, subtitleId,];
            }
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "my-2 border-t border-flixer-border" },
            });
            /** @type {__VLS_StyleScopedClasses['my-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-t']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
        }
        if (subtitleTracks.value.length === 0) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "my-2 border-t border-flixer-border" },
            });
            /** @type {__VLS_StyleScopedClasses['my-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-t']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
        }
        if (__VLS_ctx.segments.length > 0) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        void $event;
                        if (!(menuOpen.value && controlsShown.value && !__VLS_ctx.live))
                            throw 0;
                        if (!(__VLS_ctx.segments.length > 0))
                            throw 0;
                        return (setAutoSkip(!autoSkip.value));
                        // @ts-ignore
                        [subtitleTracks, segments, autoSkip,];
                    } },
                type: "button",
                role: "menuitemcheckbox",
                'aria-checked': (autoSkip.value),
                ...{ class: "flex w-full items-center justify-between rounded px-3 py-2 text-left text-sm transition hover:bg-white/10" },
                ...{ class: (autoSkip.value ? 'text-flixer-accent' : 'text-flixer-text') },
            });
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-left']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['transition']} */ ;
            /** @type {__VLS_StyleScopedClasses['hover:bg-white/10']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            (__VLS_unwrap(t, {})('player.autoSkip'));
            if (autoSkip.value) {
                let __VLS_66;
                /** @ts-ignore @type { | typeof __VLS_components.Icon} */
                Icon;
                // @ts-ignore
                const __VLS_67 = __VLS_asFunctionalComponent1(__VLS_66, new __VLS_66({
                    // @ts-ignore
                    icon: "lucide:check", ...{ class: "size-4" }, 'aria-hidden': "true",
                }));
                const __VLS_68 = __VLS_67({
                    icon: "lucide:check",
                    ...{ class: "size-4" },
                    'aria-hidden': "true",
                }, ...__VLS_functionalComponentArgsRest(__VLS_67));
                /** @type {__VLS_StyleScopedClasses['size-4']} */ ;
            }
        }
        if (__VLS_ctx.segments.length > 0) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "my-2 border-t border-flixer-border" },
            });
            /** @type {__VLS_StyleScopedClasses['my-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-t']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['pb-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['pt-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
        /** @type {__VLS_StyleScopedClasses['tracking-wide']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (__VLS_unwrap(t, {})('player.quality'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    void $event;
                    if (!(menuOpen.value && controlsShown.value && !__VLS_ctx.live))
                        throw 0;
                    return (setQuality(0));
                    // @ts-ignore
                    [t, t, segments, autoSkip, autoSkip, autoSkip,];
                } },
            type: "button",
            role: "menuitemradio",
            'aria-checked': (height.value === 0),
            ...{ class: "flex w-full items-center justify-between rounded px-3 py-2 text-left text-sm transition hover:bg-white/10" },
            ...{ class: (height.value === 0 ? 'text-flixer-accent' : 'text-flixer-text') },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-left']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-white/10']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (__VLS_unwrap(t, {})('player.originalQuality', { height: __VLS_ctx.info.source.height }));
        if (height.value === 0) {
            let __VLS_71;
            /** @ts-ignore @type { | typeof __VLS_components.Icon} */
            Icon;
            // @ts-ignore
            const __VLS_72 = __VLS_asFunctionalComponent1(__VLS_71, new __VLS_71({
                // @ts-ignore
                icon: "lucide:check", ...{ class: "size-4" }, 'aria-hidden': "true",
            }));
            const __VLS_73 = __VLS_72({
                icon: "lucide:check",
                ...{ class: "size-4" },
                'aria-hidden': "true",
            }, ...__VLS_functionalComponentArgsRest(__VLS_72));
            /** @type {__VLS_StyleScopedClasses['size-4']} */ ;
        }
        const __VLS_76 = __VLS_tryAsConstant((__VLS_unwrap(qualityOptions, {})));
        for (const [option] of __VLS_vFor(__VLS_nonNull(__VLS_76))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        void $event;
                        if (!(menuOpen.value && controlsShown.value && !__VLS_ctx.live))
                            throw 0;
                        return (setQuality(option));
                        // @ts-ignore
                        [t, height, height, height, info, qualityOptions,];
                    } },
                key: (option),
                type: "button",
                role: "menuitemradio",
                'aria-checked': (height.value === option),
                ...{ class: "flex w-full items-center justify-between rounded px-3 py-2 text-left text-sm transition hover:bg-white/10" },
                ...{ class: (height.value === option ? 'text-flixer-accent' : 'text-flixer-text') },
            });
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-left']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['transition']} */ ;
            /** @type {__VLS_StyleScopedClasses['hover:bg-white/10']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            (option);
            if (height.value === option) {
                let __VLS_77;
                /** @ts-ignore @type { | typeof __VLS_components.Icon} */
                Icon;
                // @ts-ignore
                const __VLS_78 = __VLS_asFunctionalComponent1(__VLS_77, new __VLS_77({
                    // @ts-ignore
                    icon: "lucide:check", ...{ class: "size-4" }, 'aria-hidden': "true",
                }));
                const __VLS_79 = __VLS_78({
                    icon: "lucide:check",
                    ...{ class: "size-4" },
                    'aria-hidden': "true",
                }, ...__VLS_functionalComponentArgsRest(__VLS_78));
                /** @type {__VLS_StyleScopedClasses['size-4']} */ ;
            }
            // @ts-ignore
            [height, height, height,];
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.dl, __VLS_intrinsics.dl)({
            ...{ class: "mt-2 space-y-1 border-t border-flixer-border px-3 pb-2 pt-3 text-xs text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['space-y-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-t']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['pb-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['pt-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "flex justify-between gap-3" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.dt, __VLS_intrinsics.dt)({});
        (__VLS_unwrap(t, {})('player.playback'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.dd, __VLS_intrinsics.dd)({
            ...{ class: "text-right text-flixer-text" },
        });
        /** @type {__VLS_StyleScopedClasses['text-right']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-text']} */ ;
        (__VLS_unwrap(t, {})(METHOD_LABELS.value[mode.value]));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "flex justify-between gap-3" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.dt, __VLS_intrinsics.dt)({});
        (__VLS_unwrap(t, {})('player.source'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.dd, __VLS_intrinsics.dd)({
            ...{ class: "text-right text-flixer-text" },
        });
        /** @type {__VLS_StyleScopedClasses['text-right']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-text']} */ ;
        (__VLS_ctx.info.source.videoCodec);
        (__VLS_ctx.info.source.width);
        (__VLS_ctx.info.source.height);
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onPointerup: (releaseFocus) },
        ...{ class: "absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/50 to-transparent px-3 pb-3 pt-16 transition-opacity duration-300 sm:px-6 sm:pb-4" },
        ...{ class: (controlsShown.value ? 'opacity-100' : 'pointer-events-none opacity-0') },
    });
    /** @type {__VLS_StyleScopedClasses['absolute']} */ ;
    /** @type {__VLS_StyleScopedClasses['inset-x-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['bottom-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-gradient-to-t']} */ ;
    /** @type {__VLS_StyleScopedClasses['from-black/85']} */ ;
    /** @type {__VLS_StyleScopedClasses['via-black/50']} */ ;
    /** @type {__VLS_StyleScopedClasses['to-transparent']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['pb-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['pt-16']} */ ;
    /** @type {__VLS_StyleScopedClasses['transition-opacity']} */ ;
    /** @type {__VLS_StyleScopedClasses['duration-300']} */ ;
    /** @type {__VLS_StyleScopedClasses['sm:px-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['sm:pb-4']} */ ;
    if (!__VLS_ctx.live) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ onPointerdown: (onBarDown) },
            ...{ onPointermove: (onBarMove) },
            ...{ onPointerup: (onBarUp) },
            ...{ onPointercancel: (onBarCancel) },
            ...{ onPointerleave: (onBarLeave) },
            ref: "bar",
            ...{ class: "group/seek relative flex h-6 cursor-pointer touch-none items-center" },
            role: "slider",
            'aria-label': (__VLS_unwrap(t, {})('player.seek')),
            'aria-valuemin': (0),
            'aria-valuemax': (Math.floor(__VLS_unwrap(duration, {}))),
            'aria-valuenow': (Math.floor(__VLS_unwrap(position, {}))),
            'aria-valuetext': (__VLS_unwrap(t, {})('player.seekValue', { current: format(__VLS_unwrap(position, {})), duration: format(__VLS_unwrap(duration, {})) })),
        });
        /** @type {__VLS_StyleScopedClasses['group/seek']} */ ;
        /** @type {__VLS_StyleScopedClasses['relative']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['h-6']} */ ;
        /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
        /** @type {__VLS_StyleScopedClasses['touch-none']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "relative h-1 w-full rounded bg-white/20 transition-[height] group-hover/seek:h-1.5" },
            ...{ class: ({ 'h-1.5': scrubbing.value }) },
        });
        /** @type {__VLS_StyleScopedClasses['relative']} */ ;
        /** @type {__VLS_StyleScopedClasses['h-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-white/20']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition-[height]']} */ ;
        /** @type {__VLS_StyleScopedClasses['group-hover/seek:h-1.5']} */ ;
        /** @type {__VLS_StyleScopedClasses['h-1.5']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "absolute inset-y-0 left-0 rounded bg-white/30" },
            ...{ style: ({ width: `${percent(__VLS_unwrap(bufferedEnd, {}))}%` }) },
        });
        /** @type {__VLS_StyleScopedClasses['absolute']} */ ;
        /** @type {__VLS_StyleScopedClasses['inset-y-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['left-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-white/30']} */ ;
        const __VLS_82 = __VLS_tryAsConstant((__VLS_ctx.segments));
        for (const [segment] of __VLS_vFor(__VLS_nonNull(__VLS_82))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                key: (__VLS_unwrap(segmentKey, {})(segment)),
                ...{ class: "absolute inset-y-0 bg-white/40" },
                ...{ style: ({ left: `${percent(segment.startMs / 1000)}%`, width: `${percent(segment.endMs / 1000) - percent(segment.startMs / 1000)}%` }) },
            });
            /** @type {__VLS_StyleScopedClasses['absolute']} */ ;
            /** @type {__VLS_StyleScopedClasses['inset-y-0']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-white/40']} */ ;
            // @ts-ignore
            [controlsShown, t, t, t, t, t, live, segments, info, info, info, METHOD_LABELS, mode, duration, duration, position, position, scrubbing, bufferedEnd, segmentKey,];
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "absolute inset-y-0 left-0 rounded bg-flixer-accent" },
            ...{ style: ({ width: `${percent(__VLS_unwrap(position, {}))}%` }) },
        });
        /** @type {__VLS_StyleScopedClasses['absolute']} */ ;
        /** @type {__VLS_StyleScopedClasses['inset-y-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['left-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-flixer-accent']} */ ;
        const __VLS_83 = __VLS_tryAsConstant((__VLS_unwrap(chapterTicks, {})));
        for (const [tick] of __VLS_vFor(__VLS_nonNull(__VLS_83))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                key: (tick),
                ...{ class: "absolute inset-y-0 w-0.5 -translate-x-1/2 bg-black/70" },
                ...{ style: ({ left: `${tick}%` }) },
            });
            /** @type {__VLS_StyleScopedClasses['absolute']} */ ;
            /** @type {__VLS_StyleScopedClasses['inset-y-0']} */ ;
            /** @type {__VLS_StyleScopedClasses['w-0.5']} */ ;
            /** @type {__VLS_StyleScopedClasses['-translate-x-1/2']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-black/70']} */ ;
            // @ts-ignore
            [position, chapterTicks,];
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-md shadow-black/50 transition-opacity group-hover/seek:opacity-100" },
            ...{ class: (scrubbing.value ? 'opacity-100' : 'opacity-0') },
            ...{ style: ({ left: `${percent(__VLS_unwrap(position, {}))}%` }) },
        });
        /** @type {__VLS_StyleScopedClasses['absolute']} */ ;
        /** @type {__VLS_StyleScopedClasses['top-1/2']} */ ;
        /** @type {__VLS_StyleScopedClasses['size-3.5']} */ ;
        /** @type {__VLS_StyleScopedClasses['-translate-x-1/2']} */ ;
        /** @type {__VLS_StyleScopedClasses['-translate-y-1/2']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
        /** @type {__VLS_StyleScopedClasses['shadow-md']} */ ;
        /** @type {__VLS_StyleScopedClasses['shadow-black/50']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition-opacity']} */ ;
        /** @type {__VLS_StyleScopedClasses['group-hover/seek:opacity-100']} */ ;
        if (hoverTime.value !== null) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "pointer-events-none absolute bottom-full mb-1 flex -translate-x-1/2 flex-col items-center gap-1" },
                ...{ style: ({ left: `clamp(${hoverThumb.value ? __VLS_unwrap(THUMB_WIDTH, {}) / 2 : 28}px, ${__VLS_unwrap(hoverPercent, {})}%, calc(100% - ${hoverThumb.value ? __VLS_unwrap(THUMB_WIDTH, {}) / 2 : 28}px))` }) },
            });
            /** @type {__VLS_StyleScopedClasses['pointer-events-none']} */ ;
            /** @type {__VLS_StyleScopedClasses['absolute']} */ ;
            /** @type {__VLS_StyleScopedClasses['bottom-full']} */ ;
            /** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['-translate-x-1/2']} */ ;
            /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
            if (hoverThumb.value) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "overflow-hidden rounded border border-flixer-border bg-black shadow-lg shadow-black/60" },
                    ...{ style: (hoverThumb.value) },
                });
                /** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
                /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
                /** @type {__VLS_StyleScopedClasses['border']} */ ;
                /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
                /** @type {__VLS_StyleScopedClasses['bg-black']} */ ;
                /** @type {__VLS_StyleScopedClasses['shadow-lg']} */ ;
                /** @type {__VLS_StyleScopedClasses['shadow-black/60']} */ ;
            }
            if (hoverChapter.value) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "max-w-48 truncate rounded bg-black/70 px-2 py-0.5 text-xs text-white/90" },
                });
                /** @type {__VLS_StyleScopedClasses['max-w-48']} */ ;
                /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
                /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
                /** @type {__VLS_StyleScopedClasses['bg-black/70']} */ ;
                /** @type {__VLS_StyleScopedClasses['px-2']} */ ;
                /** @type {__VLS_StyleScopedClasses['py-0.5']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-white/90']} */ ;
                (hoverChapter.value);
            }
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "rounded border border-flixer-border bg-flixer-surface px-2 py-1 text-xs font-medium tabular-nums" },
            });
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['border']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-flixer-surface']} */ ;
            /** @type {__VLS_StyleScopedClasses['px-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-1']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
            /** @type {__VLS_StyleScopedClasses['tabular-nums']} */ ;
            (format(hoverTime.value));
        }
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "mt-1 flex items-center gap-1 sm:gap-2" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['sm:gap-2']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (togglePlay) },
        type: "button",
        ...{ class: "grid size-10 place-items-center rounded text-white transition hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-flixer-accent" },
        'aria-label': (paused.value ? __VLS_unwrap(t, {})('player.play') : __VLS_unwrap(t, {})('player.pause')),
    });
    /** @type {__VLS_StyleScopedClasses['grid']} */ ;
    /** @type {__VLS_StyleScopedClasses['size-10']} */ ;
    /** @type {__VLS_StyleScopedClasses['place-items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
    /** @type {__VLS_StyleScopedClasses['transition']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:bg-white/15']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
    if (paused.value) {
        let __VLS_84;
        /** @ts-ignore @type { | typeof __VLS_components.Icon} */
        Icon;
        // @ts-ignore
        const __VLS_85 = __VLS_asFunctionalComponent1(__VLS_84, new __VLS_84({
            // @ts-ignore
            icon: "lucide:play", ...{ class: "size-6" }, 'aria-hidden': "true",
        }));
        const __VLS_86 = __VLS_85({
            icon: "lucide:play",
            ...{ class: "size-6" },
            'aria-hidden': "true",
        }, ...__VLS_functionalComponentArgsRest(__VLS_85));
        /** @type {__VLS_StyleScopedClasses['size-6']} */ ;
    }
    else {
        let __VLS_89;
        /** @ts-ignore @type { | typeof __VLS_components.Icon} */
        Icon;
        // @ts-ignore
        const __VLS_90 = __VLS_asFunctionalComponent1(__VLS_89, new __VLS_89({
            // @ts-ignore
            icon: "lucide:pause", ...{ class: "size-6" }, 'aria-hidden': "true",
        }));
        const __VLS_91 = __VLS_90({
            icon: "lucide:pause",
            ...{ class: "size-6" },
            'aria-hidden': "true",
        }, ...__VLS_functionalComponentArgsRest(__VLS_90));
        /** @type {__VLS_StyleScopedClasses['size-6']} */ ;
    }
    if (!__VLS_ctx.live) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    void $event;
                    if (!(!__VLS_ctx.live))
                        throw 0;
                    return (skip(-__VLS_unwrap(SKIP_SECONDS, {})));
                    // @ts-ignore
                    [t, t, paused, paused, live, position, scrubbing, hoverTime, hoverTime, hoverThumb, hoverThumb, hoverThumb, hoverThumb, THUMB_WIDTH, THUMB_WIDTH, hoverPercent, hoverChapter, hoverChapter, SKIP_SECONDS,];
                } },
            type: "button",
            ...{ class: "grid size-10 place-items-center rounded text-white/90 transition hover:bg-white/15 hover:text-white focus-visible:outline-2 focus-visible:outline-flixer-accent" },
            'aria-label': (__VLS_unwrap(t, {})('player.rewindSeconds', { seconds: __VLS_unwrap(SKIP_SECONDS, {}) })),
        });
        /** @type {__VLS_StyleScopedClasses['grid']} */ ;
        /** @type {__VLS_StyleScopedClasses['size-10']} */ ;
        /** @type {__VLS_StyleScopedClasses['place-items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-white/90']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-white/15']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:text-white']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
        let __VLS_94;
        /** @ts-ignore @type { | typeof __VLS_components.Icon} */
        Icon;
        // @ts-ignore
        const __VLS_95 = __VLS_asFunctionalComponent1(__VLS_94, new __VLS_94({
            // @ts-ignore
            icon: "lucide:rewind", ...{ class: "size-6" }, 'aria-hidden': "true",
        }));
        const __VLS_96 = __VLS_95({
            icon: "lucide:rewind",
            ...{ class: "size-6" },
            'aria-hidden': "true",
        }, ...__VLS_functionalComponentArgsRest(__VLS_95));
        /** @type {__VLS_StyleScopedClasses['size-6']} */ ;
    }
    if (!__VLS_ctx.live) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    void $event;
                    if (!(!__VLS_ctx.live))
                        throw 0;
                    return (skip(__VLS_unwrap(SKIP_SECONDS, {})));
                    // @ts-ignore
                    [t, live, SKIP_SECONDS, SKIP_SECONDS,];
                } },
            type: "button",
            ...{ class: "grid size-10 place-items-center rounded text-white/90 transition hover:bg-white/15 hover:text-white focus-visible:outline-2 focus-visible:outline-flixer-accent" },
            'aria-label': (__VLS_unwrap(t, {})('player.skipForwardSeconds', { seconds: __VLS_unwrap(SKIP_SECONDS, {}) })),
        });
        /** @type {__VLS_StyleScopedClasses['grid']} */ ;
        /** @type {__VLS_StyleScopedClasses['size-10']} */ ;
        /** @type {__VLS_StyleScopedClasses['place-items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-white/90']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-white/15']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:text-white']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
        let __VLS_99;
        /** @ts-ignore @type { | typeof __VLS_components.Icon} */
        Icon;
        // @ts-ignore
        const __VLS_100 = __VLS_asFunctionalComponent1(__VLS_99, new __VLS_99({
            // @ts-ignore
            icon: "lucide:fast-forward", ...{ class: "size-6" }, 'aria-hidden': "true",
        }));
        const __VLS_101 = __VLS_100({
            icon: "lucide:fast-forward",
            ...{ class: "size-6" },
            'aria-hidden': "true",
        }, ...__VLS_functionalComponentArgsRest(__VLS_100));
        /** @type {__VLS_StyleScopedClasses['size-6']} */ ;
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "group/vol flex items-center" },
    });
    /** @type {__VLS_StyleScopedClasses['group/vol']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (toggleMute) },
        type: "button",
        ...{ class: "grid size-10 place-items-center rounded text-white/90 transition hover:bg-white/15 hover:text-white focus-visible:outline-2 focus-visible:outline-flixer-accent" },
        'aria-label': (muted.value || volume.value === 0 ? __VLS_unwrap(t, {})('player.unmute') : __VLS_unwrap(t, {})('player.mute')),
    });
    /** @type {__VLS_StyleScopedClasses['grid']} */ ;
    /** @type {__VLS_StyleScopedClasses['size-10']} */ ;
    /** @type {__VLS_StyleScopedClasses['place-items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-white/90']} */ ;
    /** @type {__VLS_StyleScopedClasses['transition']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:bg-white/15']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:text-white']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
    let __VLS_104;
    /** @ts-ignore @type { | typeof __VLS_components.Icon} */
    Icon;
    // @ts-ignore
    const __VLS_105 = __VLS_asFunctionalComponent1(__VLS_104, new __VLS_104({
        // @ts-ignore
        icon: (muted.value || volume.value === 0 ? 'lucide:volume-x' : 'lucide:volume-2'), ...{ class: "size-6" }, 'aria-hidden': "true",
    }));
    const __VLS_106 = __VLS_105({
        icon: (muted.value || volume.value === 0 ? 'lucide:volume-x' : 'lucide:volume-2'),
        ...{ class: "size-6" },
        'aria-hidden': "true",
    }, ...__VLS_functionalComponentArgsRest(__VLS_105));
    /** @type {__VLS_StyleScopedClasses['size-6']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        ...{ onInput: (onVolumeInput) },
        type: "range",
        min: "0",
        max: "1",
        step: "0.01",
        'aria-label': (__VLS_unwrap(t, {})('player.volume')),
        ...{ class: "h-1 w-0 cursor-pointer accent-flixer-accent opacity-0 transition-all duration-200 group-focus-within/vol:w-20 group-focus-within/vol:opacity-100 group-hover/vol:w-20 group-hover/vol:opacity-100" },
        value: (muted.value ? 0 : volume.value),
    });
    /** @type {__VLS_StyleScopedClasses['h-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
    /** @type {__VLS_StyleScopedClasses['accent-flixer-accent']} */ ;
    /** @type {__VLS_StyleScopedClasses['opacity-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['transition-all']} */ ;
    /** @type {__VLS_StyleScopedClasses['duration-200']} */ ;
    /** @type {__VLS_StyleScopedClasses['group-focus-within/vol:w-20']} */ ;
    /** @type {__VLS_StyleScopedClasses['group-focus-within/vol:opacity-100']} */ ;
    /** @type {__VLS_StyleScopedClasses['group-hover/vol:w-20']} */ ;
    /** @type {__VLS_StyleScopedClasses['group-hover/vol:opacity-100']} */ ;
    if (!__VLS_ctx.live) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "ml-2 text-sm tabular-nums text-white/90" },
        });
        /** @type {__VLS_StyleScopedClasses['ml-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['tabular-nums']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-white/90']} */ ;
        (format(__VLS_unwrap(position, {})));
        (format(__VLS_unwrap(duration, {})));
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "flex-1" },
    });
    /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
    if (mode.value !== 'DirectPlay') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "hidden rounded border border-white/20 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-flixer-muted sm:inline" },
        });
        /** @type {__VLS_StyleScopedClasses['hidden']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-white/20']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-0.5']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-[11px]']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
        /** @type {__VLS_StyleScopedClasses['tracking-wide']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        /** @type {__VLS_StyleScopedClasses['sm:inline']} */ ;
        (mode.value === 'Transcode' ? `${height.value}p` : __VLS_unwrap(t, {})('player.remux'));
    }
    if (inVideoParty.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (toggleChat) },
            type: "button",
            ...{ class: "relative grid size-10 place-items-center rounded text-white/90 transition hover:bg-white/15 hover:text-white focus-visible:outline-2 focus-visible:outline-flixer-accent" },
            ...{ class: ({ 'text-flixer-accent': partyState.value.chatOpen.value }) },
            'aria-label': (__VLS_unwrap(t, {})('party.chat')),
            title: (__VLS_unwrap(t, {})('party.chat')),
            'aria-pressed': (partyState.value.chatOpen.value),
        });
        /** @type {__VLS_StyleScopedClasses['relative']} */ ;
        /** @type {__VLS_StyleScopedClasses['grid']} */ ;
        /** @type {__VLS_StyleScopedClasses['size-10']} */ ;
        /** @type {__VLS_StyleScopedClasses['place-items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-white/90']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-white/15']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:text-white']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-accent']} */ ;
        let __VLS_109;
        /** @ts-ignore @type { | typeof __VLS_components.Icon} */
        Icon;
        // @ts-ignore
        const __VLS_110 = __VLS_asFunctionalComponent1(__VLS_109, new __VLS_109({
            // @ts-ignore
            icon: "lucide:message-circle", ...{ class: "size-6" }, 'aria-hidden': "true",
        }));
        const __VLS_111 = __VLS_110({
            icon: "lucide:message-circle",
            ...{ class: "size-6" },
            'aria-hidden': "true",
        }, ...__VLS_functionalComponentArgsRest(__VLS_110));
        /** @type {__VLS_StyleScopedClasses['size-6']} */ ;
        if (partyState.value.unread.value > 0) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "absolute right-1 top-1 rounded-full bg-flixer-accent px-1 text-[9px] font-bold leading-4 text-black" },
            });
            /** @type {__VLS_StyleScopedClasses['absolute']} */ ;
            /** @type {__VLS_StyleScopedClasses['right-1']} */ ;
            /** @type {__VLS_StyleScopedClasses['top-1']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-flixer-accent']} */ ;
            /** @type {__VLS_StyleScopedClasses['px-1']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-[9px]']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
            /** @type {__VLS_StyleScopedClasses['leading-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-black']} */ ;
            (partyState.value.unread.value > 9 ? '9+' : partyState.value.unread.value);
        }
    }
    if (inVideoParty.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (togglePartyMenu) },
            type: "button",
            ...{ class: "relative grid size-10 place-items-center rounded text-white/90 transition hover:bg-white/15 hover:text-white focus-visible:outline-2 focus-visible:outline-flixer-accent" },
            ...{ class: ({ 'text-flixer-accent': partyMenuOpen.value }) },
            'aria-label': (__VLS_unwrap(t, {})('party.title')),
            title: (__VLS_unwrap(t, {})('party.title')),
            'aria-expanded': (partyMenuOpen.value),
        });
        /** @type {__VLS_StyleScopedClasses['relative']} */ ;
        /** @type {__VLS_StyleScopedClasses['grid']} */ ;
        /** @type {__VLS_StyleScopedClasses['size-10']} */ ;
        /** @type {__VLS_StyleScopedClasses['place-items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-white/90']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-white/15']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:text-white']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-accent']} */ ;
        let __VLS_114;
        /** @ts-ignore @type { | typeof __VLS_components.Icon} */
        Icon;
        // @ts-ignore
        const __VLS_115 = __VLS_asFunctionalComponent1(__VLS_114, new __VLS_114({
            // @ts-ignore
            icon: "lucide:users-round", ...{ class: "size-6" }, 'aria-hidden': "true",
        }));
        const __VLS_116 = __VLS_115({
            icon: "lucide:users-round",
            ...{ class: "size-6" },
            'aria-hidden': "true",
        }, ...__VLS_functionalComponentArgsRest(__VLS_115));
        /** @type {__VLS_StyleScopedClasses['size-6']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "absolute right-1 top-1 rounded-full bg-flixer-accent px-1 text-[9px] font-bold leading-4 text-black" },
        });
        /** @type {__VLS_StyleScopedClasses['absolute']} */ ;
        /** @type {__VLS_StyleScopedClasses['right-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['top-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-flixer-accent']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-[9px]']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
        /** @type {__VLS_StyleScopedClasses['leading-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-black']} */ ;
        (partyState.value.party.value?.members.length);
    }
    if (!__VLS_ctx.live) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (toggleSettingsMenu) },
            type: "button",
            ...{ class: "grid size-10 place-items-center rounded text-white/90 transition hover:bg-white/15 hover:text-white focus-visible:outline-2 focus-visible:outline-flixer-accent" },
            ...{ class: ({ 'text-flixer-accent': menuOpen.value }) },
            'aria-label': (__VLS_unwrap(t, {})('player.playbackSettings')),
            'aria-haspopup': "menu",
            'aria-expanded': (menuOpen.value),
        });
        /** @type {__VLS_StyleScopedClasses['grid']} */ ;
        /** @type {__VLS_StyleScopedClasses['size-10']} */ ;
        /** @type {__VLS_StyleScopedClasses['place-items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-white/90']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-white/15']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:text-white']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-accent']} */ ;
        let __VLS_119;
        /** @ts-ignore @type { | typeof __VLS_components.Icon} */
        Icon;
        // @ts-ignore
        const __VLS_120 = __VLS_asFunctionalComponent1(__VLS_119, new __VLS_119({
            // @ts-ignore
            icon: "lucide:settings", ...{ class: "size-6" }, 'aria-hidden': "true",
        }));
        const __VLS_121 = __VLS_120({
            icon: "lucide:settings",
            ...{ class: "size-6" },
            'aria-hidden': "true",
        }, ...__VLS_functionalComponentArgsRest(__VLS_120));
        /** @type {__VLS_StyleScopedClasses['size-6']} */ ;
    }
    if (pipSupported.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (togglePip) },
            type: "button",
            ...{ class: "grid size-10 place-items-center rounded text-white/90 transition hover:bg-white/15 hover:text-white focus-visible:outline-2 focus-visible:outline-flixer-accent" },
            ...{ class: ({ 'text-flixer-accent': isPip.value }) },
            'aria-label': (isPip.value ? __VLS_unwrap(t, {})('player.exitPip') : __VLS_unwrap(t, {})('player.pip')),
            title: (__VLS_unwrap(t, {})('player.pip') + ' (p)'),
        });
        /** @type {__VLS_StyleScopedClasses['grid']} */ ;
        /** @type {__VLS_StyleScopedClasses['size-10']} */ ;
        /** @type {__VLS_StyleScopedClasses['place-items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-white/90']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-white/15']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:text-white']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-accent']} */ ;
        let __VLS_124;
        /** @ts-ignore @type { | typeof __VLS_components.Icon} */
        Icon;
        // @ts-ignore
        const __VLS_125 = __VLS_asFunctionalComponent1(__VLS_124, new __VLS_124({
            // @ts-ignore
            icon: "lucide:picture-in-picture-2", ...{ class: "size-6" }, 'aria-hidden': "true",
        }));
        const __VLS_126 = __VLS_125({
            icon: "lucide:picture-in-picture-2",
            ...{ class: "size-6" },
            'aria-hidden': "true",
        }, ...__VLS_functionalComponentArgsRest(__VLS_125));
        /** @type {__VLS_StyleScopedClasses['size-6']} */ ;
    }
    if (__VLS_ctx.live && !__VLS_ctx.mini) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    void $event;
                    if (!(__VLS_ctx.live && !__VLS_ctx.mini))
                        throw 0;
                    return (__VLS_unwrap(emit, {})('toggle-live-guide'));
                    // @ts-ignore
                    [partyState, partyState, partyState, partyState, partyState, partyState, inVideoParty, inVideoParty, t, t, t, t, t, t, t, t, t, t, t, t, t, mini, emit, partyMenuOpen, partyMenuOpen, menuOpen, menuOpen, live, live, live, height, mode, mode, duration, position, SKIP_SECONDS, muted, muted, muted, volume, volume, volume, pipSupported, isPip, isPip,];
                } },
            type: "button",
            ...{ class: "grid size-10 place-items-center rounded text-white/90 transition hover:bg-white/15 hover:text-white focus-visible:outline-2 focus-visible:outline-flixer-accent" },
            ...{ class: ({ 'text-flixer-accent': __VLS_ctx.liveGuideOpen }) },
            'aria-label': (__VLS_unwrap(t, {})('player.liveGuide')),
            title: (__VLS_unwrap(t, {})('player.liveGuide')),
            'aria-pressed': (__VLS_ctx.liveGuideOpen),
        });
        /** @type {__VLS_StyleScopedClasses['grid']} */ ;
        /** @type {__VLS_StyleScopedClasses['size-10']} */ ;
        /** @type {__VLS_StyleScopedClasses['place-items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-white/90']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-white/15']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:text-white']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-accent']} */ ;
        let __VLS_129;
        /** @ts-ignore @type { | typeof __VLS_components.Icon} */
        Icon;
        // @ts-ignore
        const __VLS_130 = __VLS_asFunctionalComponent1(__VLS_129, new __VLS_129({
            // @ts-ignore
            icon: "lucide:list-video", ...{ class: "size-6" }, 'aria-hidden': "true",
        }));
        const __VLS_131 = __VLS_130({
            icon: "lucide:list-video",
            ...{ class: "size-6" },
            'aria-hidden': "true",
        }, ...__VLS_functionalComponentArgsRest(__VLS_130));
        /** @type {__VLS_StyleScopedClasses['size-6']} */ ;
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (toggleFullscreen) },
        type: "button",
        ...{ class: "grid size-10 place-items-center rounded text-white/90 transition hover:bg-white/15 hover:text-white focus-visible:outline-2 focus-visible:outline-flixer-accent" },
        'aria-label': (isFullscreen.value ? __VLS_unwrap(t, {})('player.exitFullscreen') : __VLS_unwrap(t, {})('player.fullscreen')),
    });
    /** @type {__VLS_StyleScopedClasses['grid']} */ ;
    /** @type {__VLS_StyleScopedClasses['size-10']} */ ;
    /** @type {__VLS_StyleScopedClasses['place-items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-white/90']} */ ;
    /** @type {__VLS_StyleScopedClasses['transition']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:bg-white/15']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:text-white']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
    let __VLS_134;
    /** @ts-ignore @type { | typeof __VLS_components.Icon} */
    Icon;
    // @ts-ignore
    const __VLS_135 = __VLS_asFunctionalComponent1(__VLS_134, new __VLS_134({
        // @ts-ignore
        icon: (isFullscreen.value ? 'lucide:minimize' : 'lucide:maximize'), ...{ class: "size-6" }, 'aria-hidden': "true",
    }));
    const __VLS_136 = __VLS_135({
        icon: (isFullscreen.value ? 'lucide:minimize' : 'lucide:maximize'),
        ...{ class: "size-6" },
        'aria-hidden': "true",
    }, ...__VLS_functionalComponentArgsRest(__VLS_135));
    /** @type {__VLS_StyleScopedClasses['size-6']} */ ;
    // @ts-ignore
    [t, t, t, t, liveGuideOpen, liveGuideOpen, isFullscreen, isFullscreen,];
    return {};
};
void [__VLS_template];
const __VLS_export = (await import('vue')).defineComponent({
    setup: () => __VLS_exposed,
    __typeEmits: {},
    __defaults: __VLS_defaults,
    __typeProps: {},
});
export default {};
