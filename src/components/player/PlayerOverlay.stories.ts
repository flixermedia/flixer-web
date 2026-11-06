import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { fn, mocked } from "storybook/test";
import { getItemPlaybackInfo, getPreferences, getStreamInfo, getSubtitleTracks, getTrickplay, getWatchProgress, saveWatchProgress } from "../../api";
import { getGuide, getGuideChannelPlaybackInfo } from "../../api/guide";
import { guideFixture, livePlaybackFixture, mockPlayerHelpers, playbackInfoFixture, streamInfoFixture, trickplayFixture } from "../../storybook/fixturesPlayer";
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
