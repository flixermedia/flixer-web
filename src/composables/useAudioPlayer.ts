import { computed, ref } from "vue";
import { Capacitor } from "@capacitor/core";
import { Directory, Filesystem } from "@capacitor/filesystem";
import Hls from "hls.js";
import { buildAudioBitrateUrl, buildHlsUrl, fetchHomeImage, getItemPlaybackInfo, getStreamInfo, getTrackLyrics, reportListening, supportsNativeHls } from "../api";
import { parseLrc, type ParsedLyrics } from "./lrc";
import { catchError } from "../utils/catchError";
import { handlePaymentRequired } from "./usePayments";

export interface QueueTrack {
	id: string;
	title: string;
	artist: string | null;
	artistId: string | null;
	album: string | null;
	albumId: string | null;
	/** Artwork of the album (or track) as an item id and image index. */
	art: { itemId: string; index: number; version?: string } | null;
}

export type RepeatMode = "off" | "all" | "one";
export type PartyAudioCommand = { action: "play" | "pause" } | { action: "seek"; position: number } | { action: "change-item"; itemId: string };

// One audio element for the whole app, so playback survives page navigation.
const audio = typeof Audio === "undefined" ? null : new Audio();
if (audio) audio.preload = "auto";
export const AUDIO_BITRATES = [128, 160, 192, 224, 256, 320] as const;
/** Quality 0 plays the original file when this browser can decode it, and falls back to a 320k MP3 otherwise. */
export const ORIGINAL_AUDIO_QUALITY = 0;
const FALLBACK_AUDIO_BITRATE = 320;
const AUDIO_BITRATE_KEY = "flixer.audioBitrate";
const LEGACY_NATIVE_AUDIO_BITRATE_KEY = "flixer.nativeAudioBitrate";
type AudioBitrate = (typeof AUDIO_BITRATES)[number];

type AudioQuality = AudioBitrate | typeof ORIGINAL_AUDIO_QUALITY;

function isAudioQuality(value: number): value is AudioQuality {
	return value === ORIGINAL_AUDIO_QUALITY || AUDIO_BITRATES.some((bitrate) => bitrate === value);
}

const storedAudioQuality = localStorage.getItem(AUDIO_BITRATE_KEY) ?? localStorage.getItem(LEGACY_NATIVE_AUDIO_BITRATE_KEY);
const initialAudioBitrate = storedAudioQuality !== null && isAudioQuality(Number(storedAudioQuality)) ? (Number(storedAudioQuality) as AudioQuality) : ORIGINAL_AUDIO_QUALITY;

const queue = ref<QueueTrack[]>([]);
const order = ref<number[]>([]);
const position = ref(-1);
const isPlaying = ref(false);
const isLoading = ref(false);
const currentTime = ref(0);
const duration = ref(0);
const audioEngine = ref<"web" | null>(null);
const audioBitrate = ref<AudioQuality>(initialAudioBitrate);
const nativeNavigationArtworkUri = ref<string | null>(null);
const volume = ref(Number(localStorage.getItem("flixer.volume") ?? 1));
const shuffle = ref(false);
const repeat = ref<RepeatMode>("off");
const error = ref("");
const lyrics = ref<ParsedLyrics | null>(null);
const lyricsLoading = ref(false);
const lyricsOpen = ref(false);

let loadToken = 0;
// The streamer re-encodes audio on the fly, so the browser sees an endless stream: it reports no duration and cannot seek.
// The track length comes from the streamer instead, and seeking restarts the stream at the requested offset.
let seekTimer: ReturnType<typeof setTimeout> | undefined;
let streamOffset = 0;
let streamBase = "";
let knownDuration = 0;
// True while the original file is played as-is, which the browser can seek natively.
let directPlay = false;
// True while an encrypted HLS stream is played; like direct play it has a real timeline and seeks natively.
let hlsPlay = false;
let hlsPlayer: Hls | null = null;

function detachHls() {
	hlsPlayer?.destroy();
	hlsPlayer = null;
	hlsPlay = false;
}
let listeningTrackId: string | null = null;
let listeningInterval: ReturnType<typeof setInterval> | undefined;
let partyControlHandler: ((command: PartyAudioCommand) => boolean) | undefined;

function requestPartyControl(command: PartyAudioCommand): boolean {
	return partyControlHandler?.(command) === true;
}

async function cacheNativeNavigationArtwork(track: QueueTrack): Promise<string | undefined> {
	if (!track.art) return undefined;
	const { itemId, index, version } = track.art;
	const path = `flixer-art-${encodeURIComponent(itemId)}-${index}-${encodeURIComponent(version ?? "current")}.jpg`;
	const blob = await fetchHomeImage(itemId, index, 512, version);
	const base64 = await new Promise<string>((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => {
			if (typeof reader.result !== "string") {
				reject(new Error("Could not encode album artwork"));
				return;
			}
			resolve(reader.result.slice(reader.result.indexOf(",") + 1));
		};
		reader.onerror = () => reject(reader.error ?? new Error("Could not read album artwork"));
		reader.readAsDataURL(blob);
	});
	await Filesystem.writeFile({ path, data: base64, directory: Directory.Cache });
	const { uri } = await Filesystem.getUri({ path, directory: Directory.Cache });
	return uri;
}

function reportPlaying(itemId: string) {
	if (listeningTrackId !== itemId) reportStopped();
	listeningTrackId = itemId;
	void reportListening(itemId, "playing").catch(() => undefined);
	if (listeningInterval) clearInterval(listeningInterval);
	listeningInterval = setInterval(() => {
		if (listeningTrackId === itemId && isPlaying.value) void reportListening(itemId, "playing").catch(() => undefined);
	}, 60_000);
}

function reportStopped() {
	if (!listeningTrackId) return;
	const itemId = listeningTrackId;
	listeningTrackId = null;
	if (listeningInterval) clearInterval(listeningInterval);
	listeningInterval = undefined;
	void reportListening(itemId, "stopped").catch(() => undefined);
}

const current = computed<QueueTrack | null>(() => {
	const index = order.value[position.value];
	return index === undefined ? null : (queue.value[index] ?? null);
});
const hasNext = computed(() => repeat.value === "all" || position.value < order.value.length - 1);

function buildOrder(startIndex: number) {
	const indexes = queue.value.map((_, i) => i);
	if (!shuffle.value) {
		order.value = indexes;
		position.value = startIndex;
		return;
	}
	const rest = indexes.filter((i) => i !== startIndex);
	for (let i = rest.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[rest[i], rest[j]] = [rest[j], rest[i]];
	}
	order.value = [startIndex, ...rest];
	position.value = 0;
}

let artworkUrl = "";
let artworkToken = 0;

function releaseArtwork() {
	if (artworkUrl) URL.revokeObjectURL(artworkUrl);
	artworkUrl = "";
}

type MediaSessionAction = Parameters<MediaSession["setActionHandler"]>[0];

function setHandler(action: MediaSessionAction, handler: MediaSessionActionHandler | null) {
	try {
		navigator.mediaSession.setActionHandler(action, handler);
	} catch {
		// The browser does not support this action.
	}
}

// iOS only shows previous/next on the lock screen when those handlers exist while the session is active, and it
// prefers seek buttons whenever seekbackward/seekforward handlers are set, so register again on every track and play.
function registerMediaSessionHandlers() {
	if (!("mediaSession" in navigator)) return;
	setHandler("play", () => {
		if (!audio || !audio.paused) return;
		if (requestPartyControl({ action: "play" })) return;
		void audio.play();
	});
	setHandler("pause", () => {
		if (!audio || audio.paused || requestPartyControl({ action: "pause" })) return;
		audio.pause();
	});
	setHandler("previoustrack", () => previous());
	setHandler("nexttrack", () => next());
	setHandler("seekbackward", null);
	setHandler("seekforward", null);
	setHandler("seekto", (details) => {
		if (details.seekTime !== undefined && details.seekTime !== null) seek(details.seekTime);
	});
}

function playbackPosition(): number {
	return audio ? streamOffset + audio.currentTime : 0;
}

function syncDuration() {
	duration.value = knownDuration > 0 ? knownDuration : audio && Number.isFinite(audio.duration) ? streamOffset + audio.duration : 0;
}

// ffprobe codec names mapped to the codec strings browsers recognise in canPlayType.
const BROWSER_AUDIO_CODECS: Record<string, string> = {
	mp3: "mp3",
	aac: "mp4a.40.2",
	alac: "alac",
	opus: "opus",
	vorbis: "vorbis",
};

// These containers carry exactly one kind of audio, so the type alone answers the question. Browsers disagree on
// codec strings for them (Chrome rejects `audio/flac; codecs="flac"`), so asking with a codec would wrongly fail.
const SELF_DESCRIBING_TYPES = new Set(["audio/mpeg", "audio/flac", "audio/wav", "audio/aac", "audio/aiff"]);

/** Whether this browser can decode the file as delivered, so it can be streamed without transcoding. */
function browserCanPlay(mimeType: string | undefined, codec: string | undefined): boolean {
	const type = mimeType?.split(";")[0]?.trim();
	if (!audio || !type) return false;
	if (SELF_DESCRIBING_TYPES.has(type)) return audio.canPlayType(type) !== "";
	const codecString = codec ? BROWSER_AUDIO_CODECS[codec.toLowerCase()] : undefined;
	return codecString !== undefined && audio.canPlayType(`${type}; codecs="${codecString}"`) !== "";
}

// The encrypted segments are AAC, which some browsers (e.g. Chromium builds without proprietary codecs) cannot decode.
function canPlayHlsAudio(): boolean {
	if (supportsNativeHls()) return true;
	return Hls.isSupported() && MediaSource.isTypeSupported('audio/mp4; codecs="mp4a.40.2"');
}

/** Plays the encrypted HLS stream: segments are useless without the key the streamer only gives to this session. */
function startHls(streamUrl: string, startAt: number) {
	if (!audio) return;
	hlsPlay = true;
	const source = buildHlsUrl(streamUrl);
	if (supportsNativeHls()) {
		audio.src = source;
		if (startAt > 0) audio.currentTime = startAt;
		return;
	}
	const player = new Hls({ startPosition: startAt > 0 ? startAt : -1 });
	hlsPlayer = player;
	player.on(Hls.Events.MEDIA_ATTACHED, () => player.loadSource(source));
	player.on(Hls.Events.ERROR, (_event, data) => {
		if (!data.fatal || player !== hlsPlayer) return;
		console.warn("Encrypted audio stream failed, falling back", data.type, data.details, data.error?.message ?? data.reason);
		const resumeAt = playbackPosition();
		detachHls();
		// Fall back to the progressive transcode from where playback stopped.
		streamOffset = resumeAt;
		if (audio && streamBase) {
			audio.src = streamUrlAt(resumeAt);
			void Promise.resolve(audio.play()).catch(() => undefined);
		}
	});
	player.attachMedia(audio);
}

function streamUrlAt(offset: number): string {
	const url = buildAudioBitrateUrl(streamBase, audioBitrate.value === ORIGINAL_AUDIO_QUALITY ? FALLBACK_AUDIO_BITRATE : audioBitrate.value);
	return offset > 0 ? `${url}${url.includes("?") ? "&" : "?"}start=${offset.toFixed(2)}` : url;
}

/** Restarts the encoded stream at `position`, keeping the play or pause state. */
function restartAt(position: number) {
	if (!audio || !streamBase) return;
	if (directPlay || hlsPlay) {
		audio.currentTime = position;
		currentTime.value = audio.currentTime;
		return;
	}
	const resume = !audio.paused;
	streamOffset = Math.max(0, position);
	currentTime.value = streamOffset;
	audio.src = streamUrlAt(streamOffset);
	if (resume) void Promise.resolve(audio.play()).catch(() => undefined);
}

function updatePositionState() {
	if (!audio || !("mediaSession" in navigator) || duration.value <= 0) return;
	try {
		navigator.mediaSession.setPositionState({ duration: duration.value, playbackRate: audio.playbackRate || 1, position: Math.min(currentTime.value, duration.value) });
	} catch {
		// Position state is optional.
	}
}

function updateMediaSession(track: QueueTrack | null) {
	if (!("mediaSession" in navigator)) return;
	registerMediaSessionHandlers();
	const token = ++artworkToken;
	navigator.mediaSession.metadata = track ? new MediaMetadata({ title: track.title, artist: track.artist ?? "", album: track.album ?? "" }) : null;
	if (!track?.art) return;
	const { itemId, index, version } = track.art;
	void fetchHomeImage(itemId, index, 512, version)
		.then((blob) => {
			if (token !== artworkToken) return;
			releaseArtwork();
			artworkUrl = URL.createObjectURL(blob);
			navigator.mediaSession.metadata = new MediaMetadata({
				title: track.title,
				artist: track.artist ?? "",
				album: track.album ?? "",
				artwork: [{ src: artworkUrl, sizes: "512x512", type: blob.type || "image/jpeg" }],
			});
		})
		.catch(() => undefined);
}

function refreshPlayback() {
	if (!audio) return;
	currentTime.value = playbackPosition();
	syncDuration();
	isPlaying.value = !audio.paused && !audio.ended;
	if (isPlaying.value && current.value) reportPlaying(current.value.id);
	else reportStopped();
	updatePositionState();
}

// Resolving the next stream URL ahead of time lets the next track start synchronously when the current one ends,
// which mobile browsers require to keep playing while the page is in the background.
const prefetched = new Map<string, Promise<string>>();

function resolveStreamUrl(id: string): Promise<string> {
	let promise = prefetched.get(id);
	if (!promise) {
		promise = getItemPlaybackInfo(id).then((info) => info.mediaSource.streamUrl);
		promise.catch(() => prefetched.delete(id));
		prefetched.set(id, promise);
	}
	return promise;
}

function prefetchNext() {
	const nextIndex = order.value[position.value + 1 < order.value.length ? position.value + 1 : repeat.value === "all" ? 0 : -1];
	const upcoming = nextIndex === undefined ? null : queue.value[nextIndex];
	if (upcoming) void resolveStreamUrl(upcoming.id).catch(() => undefined);
}

let paymentRetried = false;

async function loadCurrent(autoplay = true, startAt = 0): Promise<void> {
	const track = current.value;
	if (!audio || !track) return;
	const token = ++loadToken;
	isLoading.value = true;
	error.value = "";
	audioEngine.value = "web";
	lyrics.value = null;
	currentTime.value = Math.max(0, startAt);
	duration.value = 0;
	knownDuration = 0;
	detachHls();
	directPlay = false;
	streamOffset = Math.max(0, startAt);
	streamBase = "";
	nativeNavigationArtworkUri.value = null;
	if (Capacitor.isNativePlatform()) {
		void cacheNativeNavigationArtwork(track)
			.then((artworkUrl) => {
				if (token === loadToken) nativeNavigationArtworkUri.value = artworkUrl ?? null;
			})
			.catch((cause: unknown) => console.warn("Could not prepare native navigation artwork", cause));
	}
	updateMediaSession(track);
	function handleLoadError(cause: Error) {
		if (token !== loadToken) return;
		// A rejected play() after a user-initiated pause or skip is not an error.
		if ((cause as { name?: string }).name !== "AbortError") error.value = "error";
		isPlaying.value = false;
	}
	try {
		const [streamError, streamUrl] = await catchError(Promise.resolve().then(() => resolveStreamUrl(track.id)));
		if (streamError) {
			if (token === loadToken && !paymentRetried) {
				const unlocked = await handlePaymentRequired(streamError, track.id, track.title);
				if (unlocked === true) {
					paymentRetried = true;
					isLoading.value = false;
					return loadCurrent(autoplay, startAt).finally(() => (paymentRetried = false));
				}
				if (unlocked === false) {
					error.value = "error";
					isLoading.value = false;
					isPlaying.value = false;
					return;
				}
			}
			handleLoadError(streamError);
			return;
		}
		prefetched.delete(track.id);
		if (token !== loadToken) return;
		streamBase = streamUrl;
		const infoRequest = catchError(getStreamInfo(streamUrl));
		if (audioBitrate.value === ORIGINAL_AUDIO_QUALITY) {
			const [infoError, info] = await infoRequest;
			if (token !== loadToken) return;
			directPlay = !infoError && info.directAllowed !== false && browserCanPlay(info.mimeType, info.source.audioCodec);
		}
		const canHls = audioBitrate.value === ORIGINAL_AUDIO_QUALITY && !directPlay && canPlayHlsAudio();
		if (directPlay) {
			audio.src = streamUrl;
			if (streamOffset > 0) audio.currentTime = streamOffset;
			streamOffset = 0;
		} else if (canHls) {
			startHls(streamUrl, streamOffset);
			streamOffset = 0;
		} else {
			audio.src = streamUrlAt(streamOffset);
		}
		prefetchNext();
		void loadLyrics(streamUrl, token);
		void infoRequest.then(([infoError, info]) => {
			if (!infoError && token === loadToken) applyDuration(info.source.durationSeconds);
		});
		if (autoplay) {
			const [playError] = await catchError(Promise.resolve().then(() => audio.play()));
			if (playError) handleLoadError(playError);
		} else audio.pause();
	} finally {
		if (token === loadToken) isLoading.value = false;
	}
}

function applyDuration(seconds: number) {
	if (!Number.isFinite(seconds) || seconds <= 0) return;
	knownDuration = seconds;
	syncDuration();
	updatePositionState();
}

async function loadLyrics(streamUrl: string, token: number) {
	lyricsLoading.value = true;
	try {
		const [error, text] = await catchError(Promise.resolve().then(() => getTrackLyrics(streamUrl)));
		if (token === loadToken) {
			if (error || !text) {
				lyrics.value = null;
			} else {
				try {
					lyrics.value = parseLrc(text);
				} catch {
					lyrics.value = null;
				}
			}
		}
	} finally {
		if (token === loadToken) lyricsLoading.value = false;
	}
}

function loadQueue(tracks: QueueTrack[], startIndex = 0) {
	if (tracks.length === 0) return;
	queue.value = tracks;
	buildOrder(Math.min(Math.max(startIndex, 0), tracks.length - 1));
	void loadCurrent();
}

function playQueue(tracks: QueueTrack[], startIndex = 0) {
	const track = tracks[Math.min(Math.max(startIndex, 0), tracks.length - 1)];
	if (track && requestPartyControl({ action: "change-item", itemId: track.id })) return;
	loadQueue(tracks, startIndex);
}

async function applyPartyPlayback(track: QueueTrack, targetPosition: number, shouldPlay: boolean) {
	const changed = current.value?.id !== track.id;
	if (changed) {
		queue.value = [track];
		order.value = [0];
		position.value = 0;
		await loadCurrent(shouldPlay);
	}
	if (current.value?.id !== track.id) return;
	const boundedPosition = Math.max(0, Math.min(targetPosition, duration.value || targetPosition));
	if (!audio) return;
	if (Math.abs(playbackPosition() - boundedPosition) > 0.15) restartAt(boundedPosition);
	if (shouldPlay && audio.paused) await audio.play();
	else if (!shouldPlay && !audio.paused) audio.pause();
}

function correctPartyDrift(position: number) {
	if (!Number.isFinite(position)) return;
	if (!audio) return;
	const drift = position - playbackPosition();
	if (Math.abs(drift) >= 1) {
		audio.playbackRate = 1;
		restartAt(Math.max(0, Math.min(position, duration.value || position)));
	} else if (Math.abs(drift) >= 0.15) {
		audio.playbackRate = Math.max(0.97, Math.min(1.03, 1 + drift * 0.03));
	} else {
		audio.playbackRate = 1;
	}
}

function setPartyControlHandler(handler: ((command: PartyAudioCommand) => boolean) | undefined) {
	partyControlHandler = handler;
}

function skipTo(nextPosition: number) {
	position.value = nextPosition;
	void loadCurrent();
}

function next(auto = false) {
	if (position.value >= 0 && repeat.value === "one" && auto && current.value) {
		if (requestPartyControl({ action: "seek", position: 0 })) return;
	}
	const nextIndex = position.value + 1 < order.value.length ? position.value + 1 : repeat.value === "all" ? 0 : -1;
	const nextTrack = order.value[nextIndex] === undefined ? null : queue.value[order.value[nextIndex]];
	if (nextTrack && requestPartyControl({ action: "change-item", itemId: nextTrack.id })) return;
	if (auto && !nextTrack && current.value && requestPartyControl({ action: "pause" })) return;
	if (auto && repeat.value === "one" && audio) {
		restartAt(0);
		void audio.play();
		return;
	}
	if (position.value < order.value.length - 1) return skipTo(position.value + 1);
	if (repeat.value === "all" && order.value.length > 0) return skipTo(0);
	if (auto) isPlaying.value = false;
}

function previous() {
	if (!audio) return;
	if (playbackPosition() > 3 || position.value === 0) {
		if (requestPartyControl({ action: "seek", position: 0 })) return;
		restartAt(0);
		return;
	}
	const previousTrack = queue.value[order.value[position.value - 1]];
	if (previousTrack && requestPartyControl({ action: "change-item", itemId: previousTrack.id })) return;
	skipTo(position.value - 1);
}

function toggle() {
	if (!audio || !current.value) return;
	if (requestPartyControl({ action: isPlaying.value ? "pause" : "play" })) return;
	if (audio.paused) void audio.play();
	else audio.pause();
}

function seek(seconds: number) {
	if (!audio || !Number.isFinite(seconds)) return;
	const position = Math.max(0, Math.min(seconds, duration.value || seconds));
	if (requestPartyControl({ action: "seek", position })) return;
	// Dragging the scrub bar fires many events; only the final position starts a new encode.
	currentTime.value = position;
	clearTimeout(seekTimer);
	seekTimer = setTimeout(() => restartAt(position), 200);
}

function setVolume(value: number) {
	volume.value = Math.max(0, Math.min(1, value));
	if (audio) audio.volume = volume.value;
	localStorage.setItem("flixer.volume", String(volume.value));
}

function setAudioBitrate(value: number) {
	if (!isAudioQuality(value) || audioBitrate.value === value) return;
	audioBitrate.value = value;
	localStorage.setItem(AUDIO_BITRATE_KEY, String(value));
	if (!current.value) return;

	const resumeAt = currentTime.value;
	const shouldResume = isPlaying.value;
	isPlaying.value = false;
	void loadCurrent(shouldResume, resumeAt);
}

function toggleShuffle() {
	shuffle.value = !shuffle.value;
	const index = order.value[position.value];
	if (index !== undefined) buildOrder(index);
}

function cycleRepeat() {
	repeat.value = repeat.value === "off" ? "all" : repeat.value === "all" ? "one" : "off";
}

function stop() {
	if (requestPartyControl({ action: "pause" })) return;
	loadToken++;
	reportStopped();
	detachHls();
	audio?.pause();
	if (audio) audio.playbackRate = 1;
	if (audio) audio.removeAttribute("src");
	queue.value = [];
	order.value = [];
	position.value = -1;
	nativeNavigationArtworkUri.value = null;
	audioEngine.value = null;
	lyrics.value = null;
	lyricsOpen.value = false;
	isPlaying.value = false;
	isLoading.value = false;
	prefetched.clear();
	updateMediaSession(null);
	releaseArtwork();
}

if (audio) {
	audio.volume = Math.max(0, Math.min(1, volume.value));
	audio.addEventListener("play", () => {
		isPlaying.value = true;
		const track = current.value;
		if (track) reportPlaying(track.id);
		if ("mediaSession" in navigator) {
			registerMediaSessionHandlers();
			navigator.mediaSession.playbackState = "playing";
		}
	});
	audio.addEventListener("pause", () => {
		isPlaying.value = false;
		reportStopped();
		if ("mediaSession" in navigator) navigator.mediaSession.playbackState = "paused";
	});
	audio.addEventListener("timeupdate", () => (currentTime.value = playbackPosition()));
	audio.addEventListener("durationchange", () => {
		syncDuration();
		updatePositionState();
	});
	audio.addEventListener("seeked", updatePositionState);
	audio.addEventListener("play", updatePositionState);
	audio.addEventListener("ended", () => {
		reportStopped();
		next(true);
	});
	audio.addEventListener("error", () => {
		if (hlsPlayer) return;
		if (!audio.getAttribute("src")) return;
		if ((directPlay || hlsPlay) && streamBase) {
			// The browser could not decode the original (or native HLS) after all, so continue from here with a transcode.
			const resumeAt = playbackPosition();
			const resume = isPlaying.value || !audio.paused;
			directPlay = false;
			hlsPlay = false;
			streamOffset = resumeAt;
			audio.src = streamUrlAt(resumeAt);
			if (resume) void Promise.resolve(audio.play()).catch(() => undefined);
			return;
		}
		error.value = "error";
	});
	registerMediaSessionHandlers();
}

export function useAudioPlayer() {
	return { queue, current, position, isPlaying, isLoading, currentTime, duration, audioEngine, audioBitrate, nativeNavigationArtworkUri, volume, shuffle, repeat, error, lyrics, lyricsLoading, lyricsOpen, hasNext, playQueue, next, previous, toggle, seek, setVolume, setAudioBitrate, toggleShuffle, cycleRepeat, stop, applyPartyPlayback, correctPartyDrift, setPartyControlHandler, refreshPlayback };
}
