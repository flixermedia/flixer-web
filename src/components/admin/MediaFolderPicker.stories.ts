import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { mocked } from "storybook/test";
import { browseMediaFolders, listMediaRoots } from "../../api";
import { mediaFolders, mediaRoots } from "../../storybook/fixturesMediaAdmin";
import { modalStory } from "../../storybook/modalStory";
import MediaFolderPicker from "./MediaFolderPicker.vue";

const meta = {
	title: "Admin/MediaFolderPicker",
	component: MediaFolderPicker,
	tags: ["autodocs"],
	parameters: { layout: "fullscreen" },
	render: (args) => modalStory(MediaFolderPicker, args)(),
	beforeEach: () => {
		mocked(listMediaRoots).mockResolvedValue(mediaRoots);
		mocked(browseMediaFolders).mockImplementation(async (_rootId, path) => ({ path: path ?? "", directories: mediaFolders[path ?? ""] ?? [] }) as Awaited<ReturnType<typeof browseMediaFolders>>);
	},
} satisfies Meta<typeof MediaFolderPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const SingleRoot: Story = {
	beforeEach: () => {
		mocked(listMediaRoots).mockResolvedValue([mediaRoots[0]!]);
	},
};
export const NoRoots: Story = {
	beforeEach: () => {
		mocked(listMediaRoots).mockResolvedValue([]);
	},
};
export const BrowseError: Story = {
	beforeEach: () => {
		mocked(listMediaRoots).mockResolvedValue([mediaRoots[0]!]);
		mocked(browseMediaFolders).mockRejectedValue(new Error("Permission denied"));
	},
};
