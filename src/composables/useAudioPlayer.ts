import { computed, ref } from "vue";
import { Capacitor } from "@capacitor/core";
import { Directory, Filesystem } from "@capacitor/filesystem";
import { buildAudioBitrateUrl, fetchHomeImage, getItemPlaybackInfo, getTrackLyrics, reportListening } from "../api";
import { parseLrc, type ParsedLyrics } from "./lrc";
import { catchError } from "../utils/catchError";

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
const DEFAULT_AUDIO_BITRATE = 320;
const AUDIO_BITRATE_KEY = "flixer.audioBitrate";
const LEGACY_NATIVE_AUDIO_BITRATE_KEY = "flixer.nativeAudioBitrate";
type AudioBitrate = (typeof AUDIO_BITRATES)[number];

function isAudioBitrate(value: number): value is AudioBitrate {
	return AUDIO_BITRATES.some((bitrate) => bitrate === value);
}

const storedAudioBitrate = Number(localStorage.getItem(AUDIO_BITRATE_KEY) ?? localStorage.getItem(LEGACY_NATIVE_AUDIO_BITRATE_KEY));
const initialAudioBitrate = isAudioBitrate(storedAudioBitrate) ? storedAudioBitrate : DEFAULT_AUDIO_BITRATE;

const queue = ref<QueueTrack[]>([]);
const order = ref<number[]>([]);
const position = ref(-1);
const isPlaying = ref(false);
const isLoading = ref(false);
const currentTime = ref(0);
const duration = ref(0);
const audioEngine = ref<"web" | null>(null);
const audioBitrate = ref<AudioBitrate>(initialAudioBitrate);
const nativeNavigationArtworkUri = ref<string | null>(null);
const volume = ref(Number(localStorage.getItem("flixer.volume") ?? 1));
const shuffle = ref(false);
const repeat = ref<RepeatMode>("off");
const error = ref("");
const lyrics = ref<ParsedLyrics | null>(null);
const lyricsLoading = ref(false);
const lyricsOpen = ref(false);

let loadToken = 0;
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

function updatePositionState() {
	if (!audio || !("mediaSession" in navigator) || !Number.isFinite(audio.duration) || audio.duration <= 0) return;
	try {
		navigator.mediaSession.setPositionState({ duration: audio.duration, playbackRate: audio.playbackRate || 1, position: Math.min(audio.currentTime, audio.duration) });
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
	currentTime.value = audio.currentTime;
	duration.value = Number.isFinite(audio.duration) ? audio.duration : 0;
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

function waitForAudioMetadata(): Promise<void> {
	if (!audio || audio.readyState >= HTMLMediaElement.HAVE_METADATA) return Promise.resolve();
	return new Promise((resolve, reject) => {
		const cleanup = () => {
			audio.removeEventListener("loadedmetadata", onLoadedMetadata);
			audio.removeEventListener("error", onError);
		};
		const onLoadedMetadata = () => {
			cleanup();
			resolve();
		};
		const onError = () => {
			cleanup();
			reject(new Error("Could not load audio metadata"));
		};
		audio.addEventListener("loadedmetadata", onLoadedMetadata, { once: true });
		audio.addEventListener("error", onError, { once: true });
	});
}

async function loadCurrent(autoplay = true, startAt = 0) {
	const track = current.value;
	if (!audio || !track) return;
	const token = ++loadToken;
	isLoading.value = true;
	error.value = "";
	audioEngine.value = "web";
	lyrics.value = null;
	currentTime.value = Math.max(0, startAt);
	duration.value = 0;
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
			handleLoadError(streamError);
			return;
		}
		prefetched.delete(track.id);
		if (token !== loadToken) return;
		const bitrateStreamUrl = buildAudioBitrateUrl(streamUrl, audioBitrate.value);
		audio.src = bitrateStreamUrl;
		prefetchNext();
		void loadLyrics(streamUrl, token);
		if (startAt > 0) {
			const [metadataError] = await catchError(waitForAudioMetadata());
			if (metadataError) {
				handleLoadError(metadataError);
				return;
			}
			if (token !== loadToken) return;
			audio.currentTime = Math.min(startAt, Number.isFinite(audio.duration) ? audio.duration : startAt);
		}
		if (autoplay) {
			const [playError] = await catchError(Promise.resolve().then(() => audio.play()));
			if (playError) handleLoadError(playError);
		} else audio.pause();
	} finally {
		if (token === loadToken) isLoading.value = false;
	}
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
	if (Math.abs(audio.currentTime - boundedPosition) > 0.15) {
		audio.currentTime = boundedPosition;
		currentTime.value = audio.currentTime;
	}
	if (shouldPlay && audio.paused) await audio.play();
	else if (!shouldPlay && !audio.paused) audio.pause();
}

function correctPartyDrift(position: number) {
	if (!Number.isFinite(position)) return;
	if (!audio) return;
	const drift = position - audio.currentTime;
	if (Math.abs(drift) >= 1) {
		audio.playbackRate = 1;
		audio.currentTime = Math.max(0, Math.min(position, duration.value || position));
		currentTime.value = audio.currentTime;
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
		audio.currentTime = 0;
		void audio.play();
		return;
	}
	if (position.value < order.value.length - 1) return skipTo(position.value + 1);
	if (repeat.value === "all" && order.value.length > 0) return skipTo(0);
	if (auto) isPlaying.value = false;
}

function previous() {
	if (!audio) return;
	if (audio.currentTime > 3 || position.value === 0) {
		if (requestPartyControl({ action: "seek", position: 0 })) return;
		audio.currentTime = 0;
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
	audio.currentTime = position;
	currentTime.value = audio.currentTime;
}

function setVolume(value: number) {
	volume.value = Math.max(0, Math.min(1, value));
	if (audio) audio.volume = volume.value;
	localStorage.setItem("flixer.volume", String(volume.value));
}

function setAudioBitrate(value: number) {
	if (!isAudioBitrate(value) || audioBitrate.value === value) return;
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
	audio.addEventListener("timeupdate", () => (currentTime.value = audio.currentTime));
	audio.addEventListener("durationchange", () => {
		duration.value = Number.isFinite(audio.duration) ? audio.duration : 0;
		updatePositionState();
	});
	audio.addEventListener("seeked", updatePositionState);
	audio.addEventListener("play", updatePositionState);
	audio.addEventListener("ended", () => {
		reportStopped();
		next(true);
	});
	audio.addEventListener("error", () => {
		if (audio.getAttribute("src")) error.value = "error";
	});
	registerMediaSessionHandlers();
}

export function useAudioPlayer() {
	return { queue, current, position, isPlaying, isLoading, currentTime, duration, audioEngine, audioBitrate, nativeNavigationArtworkUri, volume, shuffle, repeat, error, lyrics, lyricsLoading, lyricsOpen, hasNext, playQueue, next, previous, toggle, seek, setVolume, setAudioBitrate, toggleShuffle, cycleRepeat, stop, applyPartyPlayback, correctPartyDrift, setPartyControlHandler, refreshPlayback };
}
