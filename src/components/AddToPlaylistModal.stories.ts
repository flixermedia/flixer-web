import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { mocked } from "storybook/test";
import { addPlaylistItem, createPlaylist, getPlaylists, getPlaylistsContaining, removePlaylistItem } from "../api";
import { modalStory } from "../storybook/modalStory";
import { playlistFixture, playlistsFixture } from "../storybook/fixturesPlaylists";
import AddToPlaylistModal from "./AddToPlaylistModal.vue";

const meta = {
	title: "Playlists/AddToPlaylistModal",
	component: AddToPlaylistModal,
	tags: ["autodocs"],
	parameters: { layout: "fullscreen" },
	args: { itemId: "track-1", title: "Midnight City" },
	render: (args) => modalStory(AddToPlaylistModal, args)(),
	beforeEach: () => {
		mocked(getPlaylists).mockResolvedValue({ playlists: playlistsFixture.map((playlist) => ({ ...playlist })) });
		mocked(getPlaylistsContaining).mockResolvedValue({ playlistIds: ["p2"] });
		mocked(addPlaylistItem).mockResolvedValue({ added: 1 });
		mocked(removePlaylistItem).mockResolvedValue(undefined as never);
		mocked(createPlaylist).mockImplementation(async (input) => playlistFixture("new", input.name, 0));
	},
} satisfies Meta<typeof AddToPlaylistModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Track: Story = {};
export const Album: Story = { args: { itemId: "album-1", title: "Hurry Up, We're Dreaming", album: true } };
export const LoadError: Story = {
	beforeEach: () => {
		mocked(getPlaylists).mockRejectedValue(new Error("offline"));
	},
};
