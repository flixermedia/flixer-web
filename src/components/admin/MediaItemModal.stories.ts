import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, mocked, userEvent, waitFor, within } from "storybook/test";
import { addMediaItemImage, browseMediaFolders, deleteItemSubtitle, downloadItemSubtitle, getMediaItem, getMediaMatchConflicts, listItemSubtitles, listMediaLibraries, listMediaRoots, refreshMediaItem, removeMediaItemImage, scanLibraryFolders, searchItemSubtitles, updateMediaItem } from "../../api";
import { mediaFolders, mediaItemDetail, mediaLibraries, mediaRoots } from "../../storybook/fixturesMediaAdmin";
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
		mocked(getMediaMatchConflicts).mockResolvedValue([]);
		mocked(listMediaLibraries).mockResolvedValue(mediaLibraries);
		mocked(listMediaRoots).mockResolvedValue(mediaRoots);
		mocked(browseMediaFolders).mockImplementation(async (rootId, path) => ({ rootId, path, directories: mediaFolders[path] ?? [] }));
		mocked(scanLibraryFolders).mockResolvedValue({ queued: true, alreadyQueued: false });
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
export const MatchConflict: Story = {
	beforeEach: () => {
		mocked(getMediaMatchConflicts).mockResolvedValue([{ id: "other", title: "Another show", path: "/media/TV Shows/Other", providers: ["tmdb"] }]);
	},
	play: async () => {
		const page = within(document.body);
		await expect((await page.findAllByText("Other sources share this match"))[0]).toBeVisible();
		await expect(page.getAllByText(/\/media\/TV Shows\/Other/)[0]).toBeVisible();
	},
};
export const RecoverSource: Story = {
	play: async () => {
		const page = within(document.body);
		await userEvent.click((await page.findAllByRole("button", { name: "Select folders to scan" }))[0]!);
		await userEvent.click((await page.findAllByLabelText("Select Arrival (2016)"))[0]!);
		await userEvent.click(page.getAllByRole("button", { name: "Scan Selected Folders" })[0]!);
		await waitFor(() => expect(scanLibraryFolders).toHaveBeenCalledWith("lib-movies", [{ rootId: "root-media", path: "Movies/Arrival (2016)" }]));
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
