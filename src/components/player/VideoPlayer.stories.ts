import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { fn, mocked } from "storybook/test";
import { getStreamInfo, getSubtitleText, getSubtitleTracks, getTrickplay } from "../../api";
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
