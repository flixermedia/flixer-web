import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, fireEvent, fn, mocked, spyOn, userEvent, waitFor } from "storybook/test";
import { Capacitor } from "@capacitor/core";
import { getStreamInfo, getSubtitleText, getSubtitleTracks, getTrickplay, type StreamInfo } from "../../api";
import { reportWebhookPlayback } from "../../api/userWebhooks";
import { getAccessToken } from "../../api/client";
import { mockPlayerHelpers, playbackInfoFixture, sampleClipUrl, streamInfoFixture, trickplayFixture } from "../../storybook/fixturesPlayer";
import { isTvMode } from "../../platform/tvMode";
import { initializeTvNavigation } from "../../platform/tvNavigation";
import { createAgent } from "@ui-sdk/vue/agent";
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
export const DesktopVolume: Story = {
	beforeEach: () => {
		const previous = localStorage.getItem("flixer.player.volume");
		localStorage.setItem("flixer.player.volume", JSON.stringify({ volume: 0.5, muted: false }));
		return () => {
			if (previous === null) localStorage.removeItem("flixer.player.volume");
			else localStorage.setItem("flixer.player.volume", previous);
		};
	},
	play: async ({ canvas, canvasElement }) => {
		const video = canvasElement.querySelector("video")!;
		const slider = canvas.getByRole("slider", { name: "Volume" }) as HTMLInputElement;
		expect(slider.closest('[data-slot="slider"]')).not.toBeNull();
		await waitFor(() => expect(video.volume).toBe(0.5));
		canvas.getByRole("button", { name: "Mute" }).focus();
		await userEvent.tab();
		expect(document.activeElement).toBe(slider);
		await userEvent.keyboard("{ArrowRight}");
		await waitFor(() => expect(video.volume).toBeCloseTo(0.51));
		expect(document.activeElement).toBe(slider);
		await userEvent.keyboard("{Home}");
		await waitFor(() => expect(video.muted).toBe(true));
		await userEvent.keyboard("{ArrowRight}");
		await waitFor(() => expect(video.volume).toBeCloseTo(0.01));
		expect(video.muted).toBe(false);
		await fireEvent.input(slider, { target: { value: "0.35" } });
		await waitFor(() => expect(video.volume).toBeCloseTo(0.35));
		await userEvent.click(canvas.getByRole("button", { name: "Mute" }));
		await waitFor(() => expect(video.muted).toBe(true));
		await userEvent.click(canvas.getByRole("button", { name: "Unmute" }));
		await waitFor(() => expect(video.muted).toBe(false));
		const agent = createAgent();
		expect(agent.snapshot()).toEqual(expect.arrayContaining([expect.objectContaining({ component: "slider", label: "Volume" })]));
		await agent.act({ steps: [{ ref: "Volume", action: "setValue", args: [0.4] }] });
		await waitFor(() => expect(video.volume).toBeCloseTo(0.4));
		slider.focus();
		const control = slider.closest('[data-slot="slider"]')!.querySelector('[data-slot="slider-control"]')!;
		await waitFor(() => expect(control.getBoundingClientRect().width).toBeGreaterThan(79));
		const rect = control.getBoundingClientRect();
		await userEvent.pointer([
			{ keys: "[MouseLeft>]", target: control, coords: { clientX: rect.left + rect.width * 0.25, clientY: rect.top + rect.height / 2 } },
			{ target: control, coords: { clientX: rect.left + rect.width * 0.75, clientY: rect.top + rect.height / 2 } },
			{ keys: "[/MouseLeft]" },
		]);
		await waitFor(() => expect(video.volume).toBeCloseTo(0.75, 1));
		expect(document.activeElement).toBe(slider);
		await userEvent.tab();
		expect(document.activeElement).not.toBe(slider);
	},
};
export const TvVolume: Story = {
	beforeEach: () => {
		const previous = isTvMode.value;
		isTvMode.value = true;
		const cleanupNavigation = initializeTvNavigation();
		return () => {
			cleanupNavigation();
			isTvMode.value = previous;
		};
	},
	play: async ({ canvas, canvasElement }) => {
		const slider = canvas.getByRole("slider", { name: "Volume" }) as HTMLInputElement;
		expect(slider.tagName).toBe("INPUT");
		expect(slider.closest('[data-slot="slider"]')).toBeNull();
		const video = canvasElement.querySelector("video")!;
		video.volume = 0.5;
		await waitFor(() => expect(Number(slider.value)).toBe(0.5));
		slider.focus();
		await userEvent.keyboard("{Enter}");
		await expect(slider).toHaveAttribute("data-tv-adjusting", "true");
		await userEvent.keyboard("{ArrowRight>3/}");
		await waitFor(() => expect(video.volume).toBeCloseTo(0.65));
		expect(document.activeElement).toBe(slider);
		await userEvent.keyboard("{Escape}");
		await expect(slider).not.toHaveAttribute("data-tv-adjusting");
		await expect(slider).toHaveFocus();
		await userEvent.keyboard("{ArrowRight}");
		expect(video.volume).toBeCloseTo(0.65);
	},
};
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
let finishTvStreamInspection: (info: StreamInfo) => void;
export const AndroidTvInitialFrame: Story = {
	beforeEach: () => {
		const platform = spyOn(Capacitor, "getPlatform").mockReturnValue("android");
		const previousTvMode = isTvMode.value;
		isTvMode.value = true;
		mocked(getStreamInfo).mockReturnValue(new Promise((resolve) => { finishTvStreamInspection = resolve; }));
		return () => {
			platform.mockRestore();
			isTvMode.value = previousTvMode;
		};
	},
	play: async ({ canvas, canvasElement }) => {
		const video = canvasElement.querySelector("video")!;
		expect(video).not.toBeVisible();
		expect(canvas.getByRole("status", { name: "Buffering" })).toBeVisible();
		isTvMode.value = false;
		await waitFor(() => expect(video).toBeVisible());
		isTvMode.value = true;
		await waitFor(() => expect(video).not.toBeVisible());
		finishTvStreamInspection(streamInfoFixture);
		await waitFor(() => expect(video.readyState).toBeGreaterThanOrEqual(2), { timeout: 15000 });
		await waitFor(() => expect(video).toBeVisible());
		video.muted = true;
		await userEvent.click(canvas.getAllByRole("button", { name: "Play" })[0]!);
		await waitFor(() => expect(video.paused).toBe(false));
	},
};
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
