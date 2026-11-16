import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, mocked, waitFor } from "storybook/test";
import { deleteMediaItem, getMediaItem, listMediaItems, listMediaLibraries, rebuildMediaSearchIndex, refreshMediaItem } from "../../api";
import { mediaItemDetail, mediaItemPage, mediaLibraries } from "../../storybook/fixturesMediaAdmin";
import { isTvMode } from "../../platform/tvMode";
import MediaPanel from "./MediaPanel.vue";

const meta = {
	title: "Admin/MediaPanel",
	component: MediaPanel,
	tags: ["autodocs"],
	parameters: { layout: "padded" },
	decorators: [() => ({ template: '<div class="w-[1100px]"><story /></div>' })],
	beforeEach: () => {
		mocked(listMediaLibraries).mockResolvedValue(mediaLibraries);
		mocked(listMediaItems).mockResolvedValue(mediaItemPage);
		mocked(getMediaItem).mockResolvedValue(mediaItemDetail);
		mocked(refreshMediaItem).mockResolvedValue(undefined as never);
		mocked(deleteMediaItem).mockResolvedValue(undefined as never);
		mocked(rebuildMediaSearchIndex).mockResolvedValue(undefined as never);
	},
} satisfies Meta<typeof MediaPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const TvMediaActions: Story = {
	beforeEach: () => {
		isTvMode.value = true;
		return () => { isTvMode.value = false; };
	},
	play: async ({ canvas }) => {
		await waitFor(() => expect(canvas.getByText("Arrival")).toBeInTheDocument());
		expect(canvas.queryByRole("button", { name: "Edit" })).toBeNull();
		expect(canvas.queryByRole("button", { name: "Manage Chapters" })).toBeNull();
		expect(canvas.getAllByRole("button", { name: "Rescan" }).length).toBeGreaterThan(0);
	},
};
export const WebMediaActions: Story = {
	play: async ({ canvas }) => {
		await waitFor(() => expect(canvas.getAllByRole("button", { name: "Edit" }).length).toBeGreaterThan(0));
		expect(canvas.getAllByRole("button", { name: "Manage Chapters" }).length).toBeGreaterThan(0);
	},
};
export const Empty: Story = {
	beforeEach: () => {
		mocked(listMediaItems).mockResolvedValue({ ...mediaItemPage, items: [], total: 0, categoryCounts: { movies: 0, tvShows: 0, music: 0 } });
	},
};
export const Loading: Story = {
	beforeEach: () => {
		mocked(listMediaItems).mockReturnValue(new Promise(() => undefined));
	},
};
export const LoadError: Story = {
	beforeEach: () => {
		mocked(listMediaItems).mockRejectedValue(new Error("Network error"));
	},
};
