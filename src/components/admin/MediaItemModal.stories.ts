import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { mocked } from "storybook/test";
import { addMediaItemImage, deleteItemSubtitle, downloadItemSubtitle, getMediaItem, listItemSubtitles, refreshMediaItem, removeMediaItemImage, searchItemSubtitles, updateMediaItem } from "../../api";
import { mediaItemDetail } from "../../storybook/fixturesMediaAdmin";
import { modalStory } from "../../storybook/modalStory";
import MediaItemModal from "./MediaItemModal.vue";

const meta = {
	title: "Admin/MediaItemModal",
	component: MediaItemModal,
	tags: ["autodocs"],
	parameters: { layout: "fullscreen" },
	args: { itemId: "item-1" },
	render: (args) => modalStory(MediaItemModal, args)(),
	beforeEach: () => {
		mocked(getMediaItem).mockResolvedValue(mediaItemDetail);
		mocked(updateMediaItem).mockResolvedValue(mediaItemDetail);
		mocked(refreshMediaItem).mockResolvedValue(undefined as never);
		mocked(addMediaItemImage).mockResolvedValue(mediaItemDetail);
		mocked(removeMediaItemImage).mockResolvedValue(mediaItemDetail);
		mocked(listItemSubtitles).mockResolvedValue({ tracks: [], configured: true });
		mocked(searchItemSubtitles).mockResolvedValue([]);
		mocked(downloadItemSubtitle).mockResolvedValue(undefined as never);
		mocked(deleteItemSubtitle).mockResolvedValue(undefined as never);
	},
} satisfies Meta<typeof MediaItemModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Movie: Story = {};
export const Series: Story = {
	beforeEach: () => {
		mocked(getMediaItem).mockResolvedValue({ ...mediaItemDetail, id: "item-3", type: "series", title: "Severance", year: 2022, childCount: 2, externalKey: "series:severance", path: "/media/TV Shows/Severance" });
	},
};
export const Loading: Story = {
	beforeEach: () => {
		mocked(getMediaItem).mockReturnValue(new Promise(() => undefined));
	},
};
export const LoadError: Story = {
	beforeEach: () => {
		mocked(getMediaItem).mockRejectedValue(new Error("Network error"));
	},
};
