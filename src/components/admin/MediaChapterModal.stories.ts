import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { closeAllModals } from "@kolirt/vue-modal";
import { expect, mocked, userEvent, waitFor, within } from "storybook/test";
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
	beforeEach: async () => {
		await closeAllModals({ ignoreGuard: true, instantExit: true });
		mocked(getItemDetail).mockResolvedValue(chapterItemDetail);
		mocked(getItemPlaybackInfo).mockResolvedValue(chapterPlaybackInfo);
		mocked(getStreamInfo).mockResolvedValue(chapterStreamInfo);
		mocked(getTrickplay).mockResolvedValue(null);
		mocked(updateMediaItem).mockResolvedValue(mediaItemDetail);
		return async () => { await closeAllModals({ ignoreGuard: true, instantExit: true }); };
	},
} satisfies Meta<typeof MediaChapterModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const EditChapterTitle: Story = {
	play: async () => {
		const page = within(document.body);
		const dialogs = await page.findAllByRole("dialog");
		const dialog = dialogs.at(-1);
		if (!dialog) throw new Error("Missing chapter editor dialog");
		await waitFor(() => expect(dialog).toHaveAttribute("data-state", "open"));
		const title = within(dialog).getAllByPlaceholderText("Chapter title")[0];
		if (!title) throw new Error("Missing chapter title field");
		if (!title) throw new Error("Missing chapter title field");
		await userEvent.clear(title);
		await userEvent.type(title, "Opening scene");
		await userEvent.click(within(dialog).getByRole("button", { name: /save/i }));
		await waitFor(() => expect(mocked(updateMediaItem)).toHaveBeenCalledWith("item-1", expect.objectContaining({
			chapters: expect.arrayContaining([expect.objectContaining({ title: "Opening scene" })]),
		})));
	},
};
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
