import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, fn, mocked, userEvent, waitFor } from "storybook/test";
import { getStreamInfo, getSubtitleText, getSubtitleTracks, getTrickplay } from "../../api";
import { reportWebhookPlayback } from "../../api/userWebhooks";
import { getAccessToken } from "../../api/client";
import { mockPlayerHelpers, playbackInfoFixture, sampleClipUrl, streamInfoFixture, trickplayFixture } from "../../storybook/fixturesPlayer";
import VideoPlayer from "./VideoPlayer.vue";

const meta = {
	title: "Player/VideoPlayer",
	component: VideoPlayer,
	tags: ["autodocs"],
	parameters: { layout: "fullscreen" },
	args: {
		streamUrl: sampleClipUrl,
		info: streamInfoFixture,
		title: "Blade Runner 2049",
		autoplay: false,
		showBack: true,
		allowMini: true,
		chapters: playbackInfoFixture.chapters,
		segments: playbackInfoFixture.segments,
		onBack: fn(),
		onError: fn(),
		onNext: fn(),
		onProgress: fn(),
		onControl: fn(),
		"onToggle-mini": fn(),
	},
	decorators: [() => ({ template: '<div class="theme-dark mx-auto aspect-video w-full max-w-4xl overflow-hidden bg-black"><story /></div>' })],
	beforeEach: () => {
		mockPlayerHelpers();
		mocked(getTrickplay).mockResolvedValue(trickplayFixture);
		mocked(getSubtitleTracks).mockResolvedValue([{ id: "en", language: "eng", label: "English" }]);
		mocked(getSubtitleText).mockResolvedValue("WEBVTT\n\n00:00:00.000 --> 00:00:06.000\nWake up, K.\n");
		mocked(getStreamInfo).mockResolvedValue(streamInfoFixture);
	},
} satisfies Meta<typeof VideoPlayer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithNextEpisode: Story = { args: { nextLabel: "S1:E2 The Next Chapter" } };
export const PartyGuest: Story = { args: { locked: true } };
export const Mini: Story = { args: { mini: true }, decorators: [() => ({ template: '<div class="theme-dark aspect-video w-96 overflow-hidden bg-black"><story /></div>' })] };
export const NoSubtitlesOrTrickplay: Story = {
	beforeEach: () => {
		mocked(getTrickplay).mockResolvedValue(null);
		mocked(getSubtitleTracks).mockResolvedValue([]);
	},
};
export const PlaybackFails: Story = { args: { streamUrl: "/missing/stream/clip.mp4" } };
export const WebhookPlayback: Story = {
	args: { analyticsTarget: { kind: "video", itemId: "movie1" } },
	beforeEach: () => { mocked(getAccessToken).mockReturnValue("story-token"); },
	play: async ({ canvasElement }) => {
		const video = canvasElement.querySelector("video")!;
		await waitFor(() => expect(video.duration).toBeGreaterThan(0), { timeout: 15000 });
		video.muted = true;
		await video.play();
		await waitFor(() => expect(mocked(reportWebhookPlayback).mock.calls.some(([event, target]) => event === "playback.started" && target.kind === "video" && target.itemId === "movie1")).toBe(true));
		video.pause();
		await waitFor(() => expect(mocked(reportWebhookPlayback).mock.calls.some(([event]) => event === "playback.paused")).toBe(true));
	},
};
export const StandaloneTrailer: Story = {
	args: {
		standalone: true,
		info: { playMethod: "DirectPlay", source: { videoCodec: "h264", audioCodec: "aac", width: 0, height: 0, durationSeconds: 0 }, availableHeights: [] },
		title: "Trailer",
		chapters: [],
		segments: [],
	},
	beforeEach: () => {
		mocked(getStreamInfo).mockClear();
		mocked(getSubtitleTracks).mockClear();
		mocked(getTrickplay).mockClear();
	},
	play: async ({ canvas, canvasElement }) => {
		const video = canvasElement.querySelector("video");
		expect(video).not.toBeNull();
		await waitFor(() => expect(video?.duration).toBeGreaterThan(0));
		expect(video?.getAttribute("src")).toBe(sampleClipUrl);
		expect(getStreamInfo).not.toHaveBeenCalled();
		expect(getSubtitleTracks).not.toHaveBeenCalled();
		expect(getTrickplay).not.toHaveBeenCalled();
		if (video) video.muted = true;
		await userEvent.click(canvas.getByRole("button", { name: "Play" }));
		await waitFor(() => expect(video?.paused).toBe(false));
	},
};
