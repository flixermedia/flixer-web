import type { IndexerStatus, IssueReport, ItemDetail, PlaybackInfo, StreamInfo } from "../api";

const hoursAgo = (hours: number) => new Date(Date.now() - hours * 3_600_000).toISOString();

const report = (id: string, title: string, status: IssueReport["status"], extra: Partial<IssueReport> = {}): IssueReport => ({
	id,
	title,
	category: "Playback",
	description: "The video stutters every few seconds and the audio drifts out of sync.",
	status,
	mediaItemId: "item-1",
	mediaTitle: "Arrival",
	chatOpen: false,
	chatConversationId: null,
	createdAt: hoursAgo(30),
	updatedAt: hoursAgo(2),
	resolvedAt: null,
	requester: { username: "bob", displayName: "Bob" },
	updates: [],
	...extra,
});

export const issueReports: IssueReport[] = [
	report("issue-1", "Stuttering playback", "open", {
		updates: [
			{ id: "u-1", body: "Happens on the living room TV only.", isInternal: false, createdAt: hoursAgo(20), author: { username: "bob", displayName: "Bob" } },
			{ id: "u-2", body: "Checked transcoder logs, looks like a codec mismatch.", isInternal: true, createdAt: hoursAgo(3), author: { username: "alice", displayName: "Alice Admin" } },
		],
	}),
	report("issue-2", "Wrong subtitles", "in_progress", { category: "Subtitles", chatOpen: true, chatConversationId: "conv-1", updatedAt: hoursAgo(5) }),
	report("issue-3", "Missing poster", "resolved", { category: "Metadata", mediaTitle: "Severance", updatedAt: hoursAgo(26), resolvedAt: hoursAgo(26) }),
	report("issue-4", "Duplicate episode", "closed", { category: "Metadata", mediaItemId: null, mediaTitle: null, updatedAt: hoursAgo(80) }),
];

export const idleIndexerStatus: IndexerStatus = {
	reachable: true,
	scans: [],
	queues: [],
	concurrency: {},
	maxConcurrency: 8,
	enabledProviders: ["tmdb"],
};

export const scanningIndexerStatus: IndexerStatus = {
	...idleIndexerStatus,
	scans: [{ libraryId: "lib-movies", state: "scanning", discovered: 240, done: 90, failed: 2 } as IndexerStatus["scans"][number]],
};

export const chapterItemDetail = {
	id: "item-1",
	type: "movie",
	title: "Arrival",
	year: 2016,
	runtimeMinutes: 116,
	chapters: [
		{ title: "Opening", startMs: 0, endMs: 600_000 },
		{ title: "First contact", startMs: 600_000, endMs: 2_400_000 },
		{ title: "Heptapod language", startMs: 2_400_000, endMs: 5_400_000 },
	],
} as unknown as ItemDetail;

export const chapterPlaybackInfo = { mediaSource: { streamUrl: "/streamer/stream/item-1?token=demo" } } as unknown as PlaybackInfo;

export const chapterStreamInfo: StreamInfo = {
	playMethod: "DirectPlay",
	source: { videoCodec: "hevc", audioCodec: "eac3", width: 3840, height: 1600, durationSeconds: 6960 },
	availableHeights: [1080, 720],
};
