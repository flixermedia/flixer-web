import type { MediaItemDetail, MediaItemPage, MediaItemSummary, MediaLibrary, MediaRoot, MediaSearchAdminStatus, MediaSearchTaskDetails, NetworkShare } from "../api";

const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString();

export const mediaRoots: MediaRoot[] = [
	{ id: "root-media", name: "Media", path: "/media" },
	{ id: "root-music", name: "Music", path: "/music" },
];

export const mediaFolders: Record<string, string[]> = {
	"": ["Movies", "TV Shows", "Documentaries"],
	Movies: ["Arrival (2016)", "Blade Runner 2049 (2017)"],
	"TV Shows": ["Severance", "Andor"],
};

export const mediaLibrary: MediaLibrary = {
	id: "lib-movies",
	name: "Movies",
	type: "movies",
	imageStorage: "cache",
	folders: [{ rootId: "root-media", rootName: "Media", path: "Movies", location: "/media/Movies", available: true }],
	createdAt: daysAgo(90),
};

export const mediaLibraries: MediaLibrary[] = [mediaLibrary, { id: "lib-shows", name: "TV Shows", type: "tvshows", imageStorage: "alongside", folders: [{ rootId: "root-media", rootName: "Media", path: "TV Shows", location: "/media/TV Shows", available: true }], createdAt: daysAgo(80) }, { id: "lib-music", name: "Music", type: "music", imageStorage: "cache", folders: [{ rootId: "root-music", rootName: "Music", path: "", location: "/music", available: false }], createdAt: daysAgo(60) }];

const summary = (id: string, libraryId: string, type: MediaItemSummary["type"], title: string, extra: Partial<MediaItemSummary> = {}): MediaItemSummary => ({
	id,
	libraryId,
	parentId: null,
	parentTitle: null,
	type,
	title,
	year: null,
	seasonNumber: null,
	episodeNumber: null,
	path: `/media/${title}`,
	providerIds: {},
	sizeBytes: 2.4e9,
	edited: false,
	poster: 0,
	updatedAt: daysAgo(2),
	...extra,
});

export const mediaItems: MediaItemSummary[] = [summary("item-1", "lib-movies", "movie", "Arrival", { year: 2016, providerIds: { tmdb: "329865" } }), summary("item-2", "lib-movies", "movie", "Blade Runner 2049", { year: 2017, edited: true }), summary("item-3", "lib-shows", "series", "Severance", { year: 2022, sizeBytes: null }), summary("item-4", "lib-shows", "episode", "Good News About Hell", { parentId: "item-3", parentTitle: "Severance", seasonNumber: 1, episodeNumber: 1, poster: null }), summary("item-5", "lib-music", "album", "Random Access Memories", { year: 2013, sizeBytes: 9.1e7 })];

export const mediaItemPage: MediaItemPage & { categoryCounts: { movies: number; tvShows: number; music: number } } = {
	items: mediaItems,
	total: mediaItems.length,
	page: 1,
	size: 25,
	categoryCounts: { movies: 2, tvShows: 2, music: 1 },
};

export const mediaItemDetail: MediaItemDetail = {
	id: "item-1",
	libraryId: "lib-movies",
	parentId: null,
	parent: null,
	childCount: 0,
	type: "movie",
	externalKey: "movie:arrival-2016",
	path: "/media/Movies/Arrival (2016)/Arrival.mkv",
	rootId: "root-media",
	relativePath: "Movies/Arrival (2016)/Arrival.mkv",
	title: "Arrival",
	sortTitle: null,
	year: 2016,
	seasonNumber: null,
	episodeNumber: null,
	episodeEndNumber: null,
	providerIds: { tmdb: "329865", imdb: "tt2543164" },
	metadata: { overview: "A linguist works with the military to communicate with alien lifeforms after twelve mysterious spacecraft appear around the world." },
	technical: { container: "matroska", videoCodec: "hevc", audioCodec: "eac3", width: 3840, height: 1600 },
	sizeBytes: 2.4e10,
	modifiedAt: daysAgo(30),
	nfoPresent: true,
	localImagesUsed: false,
	isPlaceholder: false,
	editedFields: ["title"],
	lastSeenAt: daysAgo(1),
	createdAt: daysAgo(60),
	updatedAt: daysAgo(2),
	images: [
		{ index: 0, type: "poster", provider: "tmdb", width: 2000, height: 3000, language: "en", available: true, manual: false },
		{ index: 1, type: "backdrop", provider: "tmdb", width: 3840, height: 2160, language: null, available: true, manual: false },
		{ index: 2, type: "logo", provider: "fanart", width: 800, height: 310, language: "en", available: false, manual: false },
	],
};

export const networkShares: NetworkShare[] = [
	{ id: "share-1", name: "NAS Movies", protocol: "smb", host: "nas.local", share: "movies", username: "flixer", domain: null, hasPassword: true, readOnly: true, rootId: "root-share-1", location: "/mnt/shares/nas-movies", status: "connected", error: null },
	{ id: "share-2", name: "Office Archive", protocol: "smb", host: "10.0.0.20", share: "archive", username: null, domain: "OFFICE", hasPassword: false, readOnly: false, rootId: "root-share-2", location: "/mnt/shares/office-archive", status: "error", error: "STATUS_LOGON_FAILURE" },
];

export const searchStatus: MediaSearchAdminStatus = {
	enabled: true,
	url: "http://meilisearch:7700",
	customUrl: "",
	urlSource: "default",
	apiKeyConfigured: true,
	connected: true,
	indexExists: true,
	documentCount: 5246,
	outboxPending: 3,
	outboxFailed: 0,
	lastOutboxError: null,
	tasks: [
		{ uid: 41, indexUid: "media", status: "processing", type: "documentAdditionOrUpdate", enqueuedAt: daysAgo(0.01), startedAt: daysAgo(0.005), finishedAt: null, duration: null, error: null },
		{ uid: 40, indexUid: "media", status: "succeeded", type: "documentAdditionOrUpdate", enqueuedAt: daysAgo(1), startedAt: daysAgo(1), finishedAt: daysAgo(1), duration: "PT0.8S", error: null },
		{ uid: 39, indexUid: "media", status: "failed", type: "settingsUpdate", enqueuedAt: daysAgo(2), startedAt: daysAgo(2), finishedAt: daysAgo(2), duration: "PT0.1S", error: { message: "Invalid settings payload", code: "invalid_settings", type: "invalid_request" } },
	],
	tasksError: null,
	error: null,
};

export const searchTask: MediaSearchTaskDetails = { ...searchStatus.tasks[1], details: { receivedDocuments: 120, indexedDocuments: 120 } };
