import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, fn, mocked, userEvent, waitFor } from "storybook/test";
import { getItemPlaybackInfo, getPreferences, getStreamInfo, getSubtitleTracks, getTrickplay, getWatchProgress, saveWatchProgress } from "../../api";
import { getGuide, getGuideChannelPlaybackInfo } from "../../api/guide";
import { guideFixture, livePlaybackFixture, mockPlayerHelpers, playbackInfoFixture, sampleClipUrl, streamInfoFixture, trickplayFixture } from "../../storybook/fixturesPlayer";
import { partyFixture, userFixture } from "../../storybook/fixturesSession";
import { useParty } from "../../composables/useParty";
import { useProfile } from "../../composables/useProfile";
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
