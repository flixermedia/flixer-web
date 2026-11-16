import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, fn, mocked, spyOn, userEvent, waitFor } from "storybook/test";
import { Capacitor } from "@capacitor/core";
import { getItemPlaybackInfo, getPreferences, getStreamInfo, getSubtitleText, getSubtitleTracks, getTrickplay, getWatchProgress, saveWatchProgress } from "../../api";
import { getGuide, getGuideChannelPlaybackInfo } from "../../api/guide";
import { getVideoQueue } from "../../api/userMedia";
import { guideFixture, livePlaybackFixture, mockPlayerHelpers, playbackInfoFixture, sampleClipUrl, streamInfoFixture, trickplayFixture } from "../../storybook/fixturesPlayer";
import { partyFixture, userFixture } from "../../storybook/fixturesSession";
import { useParty } from "../../composables/useParty";
import { useProfile } from "../../composables/useProfile";
import { isTvMode } from "../../platform/tvMode";
import { initializeTvNavigation } from "../../platform/tvNavigation";
import PlayerOverlay from "./PlayerOverlay.vue";

const meta = {
	title: "Player/PlayerOverlay",
	component: PlayerOverlay,
	tags: ["autodocs"],
	// The overlay is `position: fixed` and fills the viewport, so docs render it in its own iframe.
	parameters: { layout: "fullscreen", docs: { story: { inline: false, iframeHeight: 520 } } },
	args: { itemId: "movie1", title: "Blade Runner 2049", autoplay: false, onClose: fn() },
	beforeEach: () => {
		mockPlayerHelpers();
		mocked(getPreferences).mockResolvedValue({ autoSkipIntroCredits: true, audioLanguage: "eng" });
		mocked(getItemPlaybackInfo).mockResolvedValue(playbackInfoFixture);
		mocked(getStreamInfo).mockResolvedValue(streamInfoFixture);
		mocked(getWatchProgress).mockResolvedValue({ positionSeconds: 0 } as Awaited<ReturnType<typeof getWatchProgress>>);
		mocked(saveWatchProgress).mockResolvedValue(undefined as never);
		mocked(getTrickplay).mockResolvedValue(trickplayFixture);
		mocked(getSubtitleTracks).mockResolvedValue([]);
		mocked(getGuide).mockResolvedValue(guideFixture());
		mocked(getGuideChannelPlaybackInfo).mockResolvedValue(livePlaybackFixture);
		mocked(getVideoQueue).mockResolvedValue([]);
	},
} satisfies Meta<typeof PlayerOverlay>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const ResumeFromPosition: Story = { args: { startAtSeconds: 3 } };
export const Mini: Story = { args: { startMini: true } };
export const Loading: Story = { beforeEach: () => void mocked(getItemPlaybackInfo).mockReturnValue(new Promise(() => undefined)) };
export const StreamUnavailable: Story = { beforeEach: () => void mocked(getItemPlaybackInfo).mockRejectedValue(new Error("Stream unavailable")) };
export const LiveChannel: Story = { args: { itemId: "ch1", title: "News 24", livePlayback: livePlaybackFixture } };

export const WebQueueControl: Story = {
	play: async ({ canvas }) => {
		await waitFor(() => expect(canvas.getByRole("button", { name: "Up Next" })).toBeInTheDocument());
	},
};

export const TvControlsAndSubtitles: Story = {
	args: { page: true },
	beforeEach: () => {
		isTvMode.value = true;
		mocked(getSubtitleTracks).mockResolvedValue([{ id: "en", language: "eng", label: "English" }]);
		mocked(getSubtitleText).mockResolvedValue("WEBVTT\n\n00:00:00.000 --> 00:00:06.000\nHello.\n");
		return () => { isTvMode.value = false; };
	},
	play: async ({ canvas }) => {
		await waitFor(() => expect(canvas.getByRole("button", { name: "Playback Settings" })).toBeInTheDocument());
		expect(canvas.queryByRole("button", { name: "Up Next" })).toBeNull();
		await userEvent.click(canvas.getByRole("button", { name: "Playback Settings" }));
		await userEvent.click(await canvas.findByRole("menuitemradio", { name: "English (English)" }));
		await waitFor(() => expect(getSubtitleText).toHaveBeenCalled());
	},
};

export const NativeMobilePlayer: Story = {
	beforeEach: () => {
		const nativePlatform = spyOn(Capacitor, "isNativePlatform").mockReturnValue(true);
		return () => {
			nativePlatform.mockRestore();
		};
	},
	play: async ({ canvas, canvasElement }) => {
		await waitFor(() => expect(canvas.getByLabelText("Native video player")).toBeInTheDocument());
		expect(canvasElement.querySelector("video")).toBeNull();
	},
};

export const NativeTvLiveChannel: Story = {
	args: { itemId: "ch1", title: "News 24", livePlayback: livePlaybackFixture, page: true },
	beforeEach: () => {
		const nativePlatform = spyOn(Capacitor, "isNativePlatform").mockReturnValue(true);
		isTvMode.value = true;
		return () => {
			isTvMode.value = false;
			nativePlatform.mockRestore();
		};
	},
	play: async ({ canvasElement }) => {
		await waitFor(() => expect(canvasElement.querySelector("video")).not.toBeNull());
	},
};

export const TvRemoteControls: Story = {
	args: { page: true },
	beforeEach: () => {
		const previousZoom = document.documentElement.style.zoom;
		const previousScale = document.documentElement.style.getPropertyValue("--tv-scale");
		const nativePlatform = spyOn(Capacitor, "isNativePlatform").mockReturnValue(true);
		isTvMode.value = true;
		document.documentElement.style.zoom = "0.75";
		document.documentElement.style.setProperty("--tv-scale", "0.75");
		const stopNavigation = initializeTvNavigation();
		return () => {
			stopNavigation();
			nativePlatform.mockRestore();
			isTvMode.value = false;
			document.documentElement.style.zoom = previousZoom;
			if (previousScale) document.documentElement.style.setProperty("--tv-scale", previousScale);
			else document.documentElement.style.removeProperty("--tv-scale");
		};
	},
	play: async ({ canvas, canvasElement }) => {
		await waitFor(() => expect(canvas.getByRole("button", { name: "Play" })).toHaveFocus());
		const page = canvas.getByRole("main", { name: "Blade Runner 2049" });
		expect(page.getBoundingClientRect().width).toBeCloseTo(window.innerWidth, 0);
		expect(page.getBoundingClientRect().height).toBeCloseTo(window.innerHeight, 0);
		expect(canvas.queryByRole("button", { name: "Mini player" })).toBeNull();
		const video = canvasElement.querySelector("video")!;
		await waitFor(() => expect(video.duration).toBeGreaterThan(0));
		video.muted = true;
		video.loop = true;
		await userEvent.keyboard("{Enter}");
		await waitFor(() => expect(video.paused).toBe(false));
		const pause = canvas.getByRole("button", { name: "Pause" });
		await waitFor(() => expect(pause.closest(".opacity-0")).not.toBeNull(), { timeout: 5000 });
		await userEvent.keyboard("{Enter}");
		expect(video.paused).toBe(false);
		expect(pause).toHaveFocus();
		expect(pause.closest(".opacity-0")).toBeNull();
		await userEvent.keyboard("{ArrowRight}");
		expect(canvas.getByRole("button", { name: /Rewind/ })).toHaveFocus();
		expect(video.paused).toBe(false);
	},
};

const advertisement = { id: "ad-1", name: "Example", targetUrl: "https://example.com/", streamUrl: sampleClipUrl, atSeconds: 0, skipAfterSeconds: 0 };

export const Preroll: Story = {
	beforeEach: () => void mocked(getItemPlaybackInfo).mockResolvedValue({ ...playbackInfoFixture, advertisements: [advertisement] }),
	play: async ({ canvas, canvasElement }) => {
		await waitFor(() => expect(canvas.getByText(/Example/)).toBeVisible());
		expect(canvasElement.querySelectorAll("video")).toHaveLength(1);
		const ad = canvasElement.querySelector("video")!;
		expect(ad.paused).toBe(true);
		ad.muted = true;
		await userEvent.click(canvas.getByRole("button", { name: "Play" }));
		await waitFor(() => expect(ad.paused).toBe(false));
		await userEvent.click(canvas.getByRole("button", { name: "Skip ad" }));
		await waitFor(() => expect(canvas.queryByText(/Example/)).toBeNull());
		await waitFor(() => expect(canvasElement.querySelector("video")).not.toBe(ad));
	},
};

export const Midroll: Story = {
	beforeEach: () => void mocked(getItemPlaybackInfo).mockResolvedValue({ ...playbackInfoFixture, advertisements: [{ ...advertisement, atSeconds: 2 }] }),
	play: async ({ canvas, canvasElement }) => {
		await waitFor(() => expect(canvasElement.querySelector("video")?.duration).toBeGreaterThan(0));
		const content = canvasElement.querySelector("video")!;
		content.currentTime = 3;
		await waitFor(() => expect(canvas.getByText(/Example/)).toBeVisible());
		expect(canvasElement.querySelector("video")).not.toBe(content);
		await userEvent.click(canvas.getByRole("button", { name: "Skip ad" }));
		await waitFor(() => expect(canvas.queryByText(/Example/)).toBeNull());
		await waitFor(() => expect(Number(canvas.getByRole("slider", { name: "Seek" }).getAttribute("aria-valuenow"))).toBeGreaterThanOrEqual(2));
	},
};

export const PartyGuestPreroll: Story = {
	beforeEach: () => {
		mocked(getItemPlaybackInfo).mockResolvedValue({ ...playbackInfoFixture, advertisements: [advertisement] });
		const party = useParty();
		const snapshot = { ...partyFixture, playing: false, position: 3, at: Date.now() };
		useProfile().setProfile(userFixture);
		party.party.value = snapshot;
		party.latest.value = { party: snapshot, offset: 0 };
		return () => {
			party.party.value = null;
			party.latest.value = null;
			useProfile().clear();
		};
	},
	play: async ({ canvas, canvasElement }) => {
		await waitFor(() => expect(canvas.getByText(/Example/)).toBeVisible());
		await userEvent.click(canvas.getByRole("button", { name: "Skip ad" }));
		await waitFor(() => expect(canvas.queryByText(/Example/)).toBeNull());
		await waitFor(() => expect(Number(canvas.getByRole("slider", { name: "Seek" }).getAttribute("aria-valuenow"))).toBeGreaterThanOrEqual(2));
		expect(canvasElement.querySelector("video")?.paused).toBe(true);
	},
};
