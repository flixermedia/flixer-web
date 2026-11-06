import { mocked } from "storybook/test";
import type { EpgChannel, EpgData, EpgProgramme, GuidePlaybackInfo } from "../api/guide";
import { buildHlsUrl, buildStreamUrl, supportsNativeHls, type HomeFeatured, type PlaybackInfo, type StreamInfo, type Trickplay } from "../api";
import clipUrl from "./sampleClip.mp4?url";

/** A short local clip standing in for a streamer URL, so the player has real media to decode. */
export const sampleClipUrl = clipUrl;

export const streamInfoFixture: StreamInfo = {
	playMethod: "DirectPlay",
	source: { videoCodec: "h264", audioCodec: "aac", width: 640, height: 360, durationSeconds: 6, audioTracks: [{ index: 1, codec: "aac", language: "eng", title: "English", channels: 2, default: true }] },
	availableHeights: [360, 720],
	directAllowed: true,
};

export const playbackInfoFixture: PlaybackInfo = {
	playSessionId: "session-1",
	mediaSource: { id: "movie1", title: "Blade Runner 2049", container: "mp4", directPlay: true, mediaSourceId: "source-1", streamUrl: sampleClipUrl },
	expiresAt: "2099-01-01T00:00:00.000Z",
	title: "Blade Runner 2049",
	nextEpisode: null,
	chapters: [
		{ title: "Opening", startMs: 0, endMs: 3000 },
		{ title: "Finale", startMs: 3000, endMs: 6000 },
	],
	segments: [{ type: "intro", startMs: 500, endMs: 2500, source: "manual" }],
};

const sheet = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900"><rect width="1600" height="900" fill="#0e7490"/><rect x="800" width="800" height="900" fill="#6d28d9"/><rect y="450" width="1600" height="450" fill="#0f172a" fill-opacity=".5"/></svg>')}`;

export const trickplayFixture: Trickplay = {
	manifest: { intervalMs: 1000, thumbWidth: 160, thumbHeight: 90, columns: 10, rows: 10, count: 6, sheets: 1 },
	sheetUrl: () => sheet,
};

export const featuredFixtures: HomeFeatured[] = [
	{ id: "movie1", type: "movie", title: "Blade Runner 2049", tagline: null, overview: "A young blade runner's discovery of a long-buried secret leads him to track down former blade runner Rick Deckard.", rating: "R", runtimeMinutes: 164, year: 2017, poster: 0, backdrop: 0, updatedAt: "2025-01-01T00:00:00.000Z" },
	{ id: "series1", type: "series", title: "Severance", tagline: null, overview: "Mark leads a team of office workers whose memories have been surgically divided between their work and personal lives.", rating: "TV-MA", runtimeMinutes: null, year: 2022, poster: 0, backdrop: 0, updatedAt: "2025-01-01T00:00:00.000Z" },
	{ id: "movie2", type: "movie", title: "The Lord of the Rings: The Fellowship of the Ring", tagline: null, overview: null, rating: null, runtimeMinutes: 178, year: 2001, poster: 0, backdrop: null, updatedAt: "2025-01-01T00:00:00.000Z" },
];

const MINUTE = 60_000;
const channel = (id: string, name: string, sortOrder: number, watchable = true): EpgChannel => ({ id, name, icon: null, alternateNames: [], variantCount: 1, iptvChannelId: watchable ? `iptv-${id}` : null, watchable, sortOrder });

export const guideChannels: EpgChannel[] = [channel("ch1", "News 24", 1), channel("ch2", "Movie Central", 2), channel("ch3", "Kids Zone", 3), channel("ch4", "Archive TV", 4, false)];

const programme = (channelId: string, startMin: number, durationMin: number, title: string, description?: string): EpgProgramme => ({ channelExternalId: channelId, channelId, start: Date.now() + startMin * MINUTE, stop: Date.now() + (startMin + durationMin) * MINUTE, title, description });

export const guideProgrammes: EpgProgramme[] = guideChannels.flatMap((item, index) => [programme(item.id, -30, 60, `Live now on ${item.name}`, "Currently airing programme."), programme(item.id, 30, 60, `Up next ${index + 1}`, "Starts shortly."), programme(item.id, 90, 90, "Late show")]);

export function guideFixture(channels: EpgChannel[] = guideChannels, totalChannels = channels.length): EpgData {
	return { channels, programmes: guideProgrammes.filter((item) => channels.some((entry) => entry.id === item.channelId)), totalChannels, channelOffset: 0, sources: [] };
}

export const livePlaybackFixture: GuidePlaybackInfo = {
	playSessionId: "live-1",
	mediaSource: { id: "ch1", title: "News 24", container: "m3u8", directPlay: true, mediaSourceId: "ch1", streamUrl: sampleClipUrl },
	expiresAt: "2099-01-01T00:00:00.000Z",
};

/** URL builders and feature checks are plain api functions, so Storybook replaces them with spies; restore the behaviour the player needs. */
export function mockPlayerHelpers() {
	mocked(buildStreamUrl).mockImplementation((streamUrl) => streamUrl);
	mocked(buildHlsUrl).mockImplementation((streamUrl) => streamUrl);
	mocked(supportsNativeHls).mockReturnValue(false);
}
