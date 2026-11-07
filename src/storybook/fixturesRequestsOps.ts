import type { AdminScheduledTask, RequestServiceTest, RequestServiceView, RequestUserView, RequestsConfig, StreamSessionList, SubtitleFile, SubtitleSearchResult, UpdateStatus } from "../api";

const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();

export const requestServices: RequestServiceView[] = [
	{ id: "svc-radarr", kind: "radarr", name: "Radarr", url: "http://radarr:7878", hasKey: true, isDefault: true, enabled: true, libraryId: "lib-movies", libraryName: "Movies", rootFolder: "/media/movies", qualityProfileId: 1, metadataProfileId: null, languageProfileId: null, minimumAvailability: "released", seasonFolders: true, tags: [] },
	{ id: "svc-sonarr", kind: "sonarr", name: "Sonarr", url: "http://sonarr:8989", hasKey: true, isDefault: true, enabled: false, libraryId: "lib-shows", libraryName: "TV Shows", rootFolder: "/media/shows", qualityProfileId: 2, metadataProfileId: null, languageProfileId: null, minimumAvailability: null, seasonFolders: true, tags: [] },
];

export const requestServiceTest: RequestServiceTest = {
	ok: true,
	version: "5.2.6",
	error: null,
	qualityProfiles: [
		{ id: 1, name: "HD-1080p" },
		{ id: 2, name: "Ultra-HD" },
	],
	rootFolders: [
		{ path: "/media/shows", freeSpace: 1.2e12 },
		{ path: "/media/anime", freeSpace: 4e11 },
	],
	metadataProfiles: [],
	languageProfiles: [],
};

export const requestUsers: RequestUserView[] = [
	{ id: "u1", username: "alice", displayName: "Alice Admin", role: "admin", canRequest: null, autoApprove: true, quotaLimit: null, quotaDays: null },
	{ id: "u2", username: "bob", displayName: "Bob Martin", role: "user", canRequest: true, autoApprove: null, quotaLimit: 5, quotaDays: 7 },
	{ id: "u3", username: "carol", displayName: null, role: "user", canRequest: false, autoApprove: null, quotaLimit: null, quotaDays: null },
];

export const requestsConfig: RequestsConfig = { enabled: true, movies: true, tv: true, music: false, canRequest: true, autoApprove: true, isAdmin: true, quota: { limit: null, days: 7, used: 0, remaining: null }, tmdbConfigured: true, discogsConfigured: true };

export const requestSettings = [
	{ key: "requests_enabled", value: true, isPublic: false, updatedAt: minutesAgo(600) },
	{ key: "requests_auto_approve", value: false, isPublic: false, updatedAt: minutesAgo(600) },
	{ key: "requests_quota_limit", value: 10, isPublic: false, updatedAt: minutesAgo(600) },
	{ key: "requests_quota_days", value: 7, isPublic: false, updatedAt: minutesAgo(600) },
];

export const streamSessions: StreamSessionList = {
	transcodingAvailable: true,
	maxTranscodes: 4,
	activeTranscodes: 1,
	sessions: [
		{
			id: "stream-1",
			user: { username: "alice", displayName: "Alice Admin" },
			file: "Arrival (2016).mkv",
			delivery: "hls",
			mode: "Transcode",
			height: 720,
			source: { videoCodec: "hevc", audioCodec: "eac3", width: 3840, height: 2160, durationSeconds: 6960 },
			positionSeconds: 1800,
			startedAt: minutesAgo(32),
			lastActivityAt: minutesAgo(0),
			bytesSent: 1.4e9,
			running: true,
			remoteAddr: "192.168.1.20",
			userAgent: "Mozilla/5.0 (X11; Linux x86_64) Firefox/131.0",
		},
		{
			id: "stream-2",
			user: { username: "bob", displayName: "Bob Martin" },
			file: "Severance S01E01.mkv",
			delivery: "progressive",
			mode: "DirectPlay",
			height: 0,
			source: { videoCodec: "h264", audioCodec: "aac", width: 1920, height: 1080, durationSeconds: 3300 },
			positionSeconds: 600,
			startedAt: minutesAgo(11),
			lastActivityAt: minutesAgo(0),
			bytesSent: 4.2e8,
			running: false,
		},
		{
			id: "stream-3",
			user: null,
			file: "Blade Runner 2049.mkv",
			delivery: "hls",
			mode: "DirectStream",
			height: 1080,
			source: { videoCodec: "h264", audioCodec: "dts", width: 1920, height: 1080, durationSeconds: 9840 },
			positionSeconds: 120,
			startedAt: minutesAgo(3),
			lastActivityAt: minutesAgo(1),
			bytesSent: 8e7,
			running: true,
		},
	],
};

export const subtitleTracks: SubtitleFile[] = [
	{ file: "Arrival.en.srt", language: "en", format: "srt" },
	{ file: "Arrival.es.forced.srt", language: "es", format: "srt", label: "Forced" },
];

export const subtitleResults: SubtitleSearchResult[] = [
	{ fileId: 101, language: "en", release: "Arrival.2016.1080p.BluRay.x264", fileName: "Arrival.2016.1080p.BluRay.x264.srt", downloads: 48210, hearingImpaired: false, hashMatch: true, rating: 8.4, uploader: "subfan" },
	{ fileId: 102, language: "en", release: "Arrival.2016.WEB-DL", fileName: "Arrival.2016.WEB-DL.srt", downloads: 9120, hearingImpaired: true, hashMatch: false, rating: 6.9 },
];


export const scheduledTasks: AdminScheduledTask[] = [
	{ id: "scan", name: "Scan libraries", category: "Library", description: "Look for new and changed media files.", enabled: true, cron: "0 */6 * * *", state: "completed", lastRunAt: minutesAgo(120) },
	{ id: "refresh", name: "Refresh metadata", category: "Library", description: "Update artwork and metadata from providers.", enabled: true, cron: "0 3 * * *", state: "running", lastRunAt: minutesAgo(5), progress: 40 },
	{ id: "cleanup", name: "Clean up cache", category: "Maintenance", description: "Remove stale transcodes and cached images.", enabled: false, cron: "0 4 * * 0", state: "failed", lastRunAt: minutesAgo(60 * 30), lastError: "Permission denied: /cache/transcodes" },
	{ id: "guide", name: "Refresh guide", category: "Guide", description: "Download the latest programme guide.", enabled: true, cron: "30 2 * * *", state: "never", lastRunAt: null },
];

export const updateStatus: UpdateStatus = {
	components: [
		{ id: "flixer", label: "Flixer API", installed: "1.8.2", latest: "1.9.0", reachable: true, updateAvailable: true },
		{ id: "web", label: "Flixer Web", installed: "1.8.2", latest: "1.9.0", reachable: true, updateAvailable: true },
		{ id: "streamer", label: "Streamer", installed: "1.8.0", latest: "1.8.0", reachable: true, updateAvailable: false },
		{ id: "indexer", label: "Indexer", installed: "1.8.1", latest: "1.8.1", reachable: true, updateAvailable: false },
	],
	updatesAvailable: 2,
	lastCheckedAt: minutesAgo(15),
	canApply: true,
	updaterReachable: true,
	run: null,
	backups: [{ name: "pre-update-1.8.2.tar.gz", sizeBytes: 2.4e8, createdAt: minutesAgo(60 * 24 * 12) }],
};

export const transcodingSettings = [
	{ key: "transcode_hw_accel", value: "vaapi", isPublic: false, updatedAt: minutesAgo(600) },
	{ key: "transcode_preset", value: "veryfast", isPublic: false, updatedAt: minutesAgo(600) },
	{ key: "transcode_crf", value: 23, isPublic: false, updatedAt: minutesAgo(600) },
	{ key: "transcode_threads", value: 0, isPublic: false, updatedAt: minutesAgo(600) },
	{ key: "transcode_max_bitrate_kbps", value: 8000, isPublic: false, updatedAt: minutesAgo(600) },
	{ key: "transcode_max_concurrent", value: 4, isPublic: false, updatedAt: minutesAgo(600) },
];
