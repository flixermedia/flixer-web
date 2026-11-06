import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { mediaLibraries } from "../../storybook/fixturesMediaAdmin";
import { modalStory } from "../../storybook/modalStory";
import LibraryRescanModal from "./LibraryRescanModal.vue";

const meta = {
	title: "Admin/LibraryRescanModal",
	component: LibraryRescanModal,
	tags: ["autodocs"],
	parameters: { layout: "fullscreen" },
	args: { library: mediaLibraries[0]! },
	render: (args) => modalStory(LibraryRescanModal, args)(),
} satisfies Meta<typeof LibraryRescanModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Movies: Story = {};
export const TvShows: Story = { args: { library: mediaLibraries[1]! } };
export const Music: Story = { args: { library: mediaLibraries[2]! } };
