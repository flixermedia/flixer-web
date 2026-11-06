import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { mocked } from "storybook/test";
import { browseMediaFolders, createMediaLibrary, listMediaRoots, updateMediaLibrary } from "../../api";
import { mediaFolders, mediaLibrary, mediaRoots } from "../../storybook/fixturesMediaAdmin";
import { modalStory } from "../../storybook/modalStory";
import LibraryModal from "./LibraryModal.vue";

const meta = {
	title: "Admin/LibraryModal",
	component: LibraryModal,
	tags: ["autodocs"],
	parameters: { layout: "fullscreen" },
	render: (args) => modalStory(LibraryModal, args)(),
	beforeEach: () => {
		mocked(listMediaRoots).mockResolvedValue(mediaRoots);
		mocked(browseMediaFolders).mockImplementation(async (_rootId, path) => ({ path: path ?? "", directories: mediaFolders[path ?? ""] ?? [] }) as Awaited<ReturnType<typeof browseMediaFolders>>);
		mocked(createMediaLibrary).mockResolvedValue(mediaLibrary);
		mocked(updateMediaLibrary).mockResolvedValue(mediaLibrary);
	},
} satisfies Meta<typeof LibraryModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Create: Story = {};
export const Edit: Story = { args: { library: mediaLibrary } };
