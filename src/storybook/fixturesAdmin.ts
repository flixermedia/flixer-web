import type { AccessOptions, AccessPolicy, AccessPreview, AdminOverview, AdminUser, BackupStatus, IndexerStatus, MediaLibrary } from "../api";

const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();

export const adminOverview: AdminOverview = {
	counts: { users: 8, movies: 1240, series: 86, episodes: 3920, albums: 214, tracks: 2650 },
	libraries: [
		{ id: "lib-movies", name: "Movies", type: "movies", items: 1240, sizeBytes: 3.4e12 },
		{ id: "lib-shows", name: "TV Shows", type: "tvshows", items: 3920, sizeBytes: 5.1e12 },
		{ id: "lib-music", name: "Music", type: "music", items: 2650, sizeBytes: 4.2e11 },
	],
	storage: {
		usedBytes: 8.9e12,
		disks: [
			{ totalBytes: 1.6e13, freeBytes: 7.1e12, roots: ["/media"] },
			{ totalBytes: 2e12, freeBytes: 1.4e12, roots: ["/music"] },
		],
	},
	activity: [
		{ user: "alice", title: "Arrival", type: "movie", showTitle: null, seasonNumber: null, episodeNumber: null, positionSeconds: 3600, durationSeconds: 6960, completed: false, at: minutesAgo(5) },
		{ user: "bob", title: "Pilot", type: "episode", showTitle: "Severance", seasonNumber: 1, episodeNumber: 1, positionSeconds: 3300, durationSeconds: 3300, completed: true, at: minutesAgo(48) },
		{ user: "carol", title: "Blade Runner 2049", type: "movie", showTitle: null, seasonNumber: null, episodeNumber: null, positionSeconds: 600, durationSeconds: 9840, completed: false, at: minutesAgo(190) },
	],
	server: {
		name: "flixer-home",
		version: "1.8.2",
		node: "v22.11.0",
		os: "Linux 6.8 (x64)",
		uptimeSeconds: 3 * 86400 + 4 * 3600,
		streamer: { reachable: true, transcodingAvailable: true, activeTranscodes: 2, maxTranscodes: 4, sessions: 3 },
		indexer: { reachable: true, activeScans: 0, providers: ["tmdb", "musicbrainz"] },
	},
};

export const backupStatus: BackupStatus = {
	updaterReachable: true,
	canRestore: true,
	passphraseSet: true,
	schedule: "daily",
	keep: 7,
	lastScheduledAt: minutesAgo(600),
	run: null,
	backups: [
		{ name: "flixer-2026-11-04.tar.gz", size: 412_000_000, createdAt: minutesAgo(600), encrypted: true, components: ["database", "config", "images"], versions: { flixer: "1.8.2" } },
		{ name: "flixer-2026-11-03.tar.gz", size: 408_000_000, createdAt: minutesAgo(2040), encrypted: true, components: ["database", "config", "images"], versions: { flixer: "1.8.1" } },
	],
};

export const indexerStatus: IndexerStatus = {
	reachable: true,
	scans: [],
	queues: [
		{ queue: "metadata", pending: 120, active: 4, scheduled: 0, retry: 2, archived: 0, completed: 800, processed: 920, failed: 1, paused: false, latencyMs: 40 },
		{ queue: "images", pending: 45, active: 2, scheduled: 0, retry: 0, archived: 0, completed: 300, processed: 347, failed: 3, paused: false, latencyMs: 90 },
	],
	concurrency: { metadata: 4, images: 2 },
	maxConcurrency: 8,
	enabledProviders: ["tmdb", "musicbrainz"],
};

export const adminUser: AdminUser = {
	id: "user-2",
	username: "bob",
	displayName: "Bob Martin",
	email: "bob@example.com",
	emailVerified: true,
	role: "user",
	disabled: false,
	passkeys: 1,
	activeSessions: 2,
	lastActiveAt: minutesAgo(30),
	createdAt: minutesAgo(60 * 24 * 90),
	avatarUrl: null,
	current: false,
};

export const mediaLibraries: MediaLibrary[] = [
	{ id: "lib-movies", name: "Movies", type: "movies", createdAt: minutesAgo(60 * 24 * 30), imageStorage: "cache", folders: [{ rootId: "media", rootName: "Media", location: "/media/movies", available: true, path: "movies" }] },
	{ id: "lib-shows", name: "TV Shows", type: "tvshows", createdAt: minutesAgo(60 * 24 * 30), imageStorage: "cache", folders: [{ rootId: "media", rootName: "Media", location: "/media/shows", available: true, path: "shows" }] },
	{ id: "lib-music", name: "Music", type: "music", createdAt: minutesAgo(60 * 24 * 30), imageStorage: "alongside", folders: [{ rootId: "media", rootName: "Media", location: "/media/music", available: true, path: "music" }] },
];

export const accessPolicy: AccessPolicy = {
	libraryMode: "selected",
	libraryIds: ["lib-movies"],
	maxAge: 13,
	blockUnrated: true,
	allowedTags: [],
	blockedTags: ["horror"],
	schedule: { timezone: "Europe/Berlin", windows: [{ days: [1, 2, 3, 4, 5], from: "15:00", to: "20:00" }] },
	requireRequestApproval: true,
	hasPin: true,
};

export const accessOptions: AccessOptions = {
	ratings: [
		{ age: 0, label: "All ages", examples: "G, TV-Y" },
		{ age: 7, label: "7+", examples: "PG, TV-Y7" },
		{ age: 13, label: "13+", examples: "PG-13, TV-14" },
		{ age: 16, label: "16+", examples: "R, TV-MA" },
	],
	tags: ["horror", "violence", "romance", "documentary"],
};

export const accessPreview: AccessPreview = {
	libraries: [
		{ id: "lib-movies", name: "Movies", type: "movies", total: 1240, visible: 820, hidden: false },
		{ id: "lib-shows", name: "TV Shows", type: "tvshows", total: 86, visible: 0, hidden: true },
	],
	blocked: [{ id: "item-1", title: "The Shining", type: "movie", year: 1980, reason: "rating" }],
	schedule: { configured: true, allowedNow: false, nextAllowedAt: minutesAgo(-120) },
};
