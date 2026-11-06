import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { mocked } from "storybook/test";
import { createPlaylist, updatePlaylist, type PlaylistSummary } from "../api";
import { modalStory } from "../storybook/modalStory";
import PlaylistEditorModal from "./PlaylistEditorModal.vue";

const playlist = { id: "pl-1", name: "Road trip", description: "Songs for the drive", isPublic: false, trackCount: 12 } as unknown as PlaylistSummary;

const meta = {
	title: "Social/PlaylistEditorModal",
	component: PlaylistEditorModal,
	tags: ["autodocs"],
	parameters: { layout: "fullscreen" },
	beforeEach: () => {
		mocked(createPlaylist).mockResolvedValue(playlist);
		mocked(updatePlaylist).mockResolvedValue(playlist);
	},
	render: (args) => modalStory(PlaylistEditorModal, args)(),
} satisfies Meta<typeof PlaylistEditorModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Create: Story = {};
export const Edit: Story = { args: { playlist } };
export const SaveFails: Story = {
	args: { playlist },
	beforeEach: () => {
		mocked(updatePlaylist).mockRejectedValue(new Error("Server error"));
	},
};
