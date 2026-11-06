import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { mocked } from "storybook/test";
import { getItemDetail, getItemPlaybackInfo, getStreamInfo, getTrickplay, updateMediaItem } from "../../api";
import { chapterItemDetail, chapterPlaybackInfo, chapterStreamInfo } from "../../storybook/fixturesLeft00";
import { mediaItemDetail } from "../../storybook/fixturesMediaAdmin";
import { modalStory } from "../../storybook/modalStory";
import MediaChapterModal from "./MediaChapterModal.vue";

const meta = {
	title: "Admin/MediaChapterModal",
	component: MediaChapterModal,
	tags: ["autodocs"],
	parameters: { layout: "fullscreen" },
	args: { itemId: "item-1" },
	render: (args) => modalStory(MediaChapterModal, args)(),
	beforeEach: () => {
		mocked(getItemDetail).mockResolvedValue(chapterItemDetail);
		mocked(getItemPlaybackInfo).mockResolvedValue(chapterPlaybackInfo);
		mocked(getStreamInfo).mockResolvedValue(chapterStreamInfo);
		mocked(getTrickplay).mockResolvedValue(null);
		mocked(updateMediaItem).mockResolvedValue(mediaItemDetail);
	},
} satisfies Meta<typeof MediaChapterModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const NoChapters: Story = {
	beforeEach: () => {
		mocked(getItemDetail).mockResolvedValue({ ...chapterItemDetail, chapters: [] });
	},
};
export const PlaybackUnavailable: Story = {
	beforeEach: () => {
		mocked(getItemPlaybackInfo).mockRejectedValue(new Error("Playback unavailable"));
	},
};
export const Loading: Story = {
	beforeEach: () => {
		mocked(getItemDetail).mockReturnValue(new Promise(() => undefined));
	},
};
export const LoadError: Story = {
	beforeEach: () => {
		mocked(getItemDetail).mockRejectedValue(new Error("Network error"));
	},
};
