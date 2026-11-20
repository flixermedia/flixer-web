import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { closeModalsByGroup } from "@kolirt/vue-modal";
import { createAgent } from "@ui-sdk/vue/agent";
import { expect, mocked, userEvent, waitFor, within } from "storybook/test";
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
		return async () => { await closeModalsByGroup("default", { instantExit: true }); };
	},
} satisfies Meta<typeof AddToPlaylistModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Track: Story = {};
export const Album: Story = { args: { itemId: "album-1", title: "Hurry Up, We're Dreaming", album: true } };
export const AlbumAction: Story = {
	args: { itemId: "album-1", title: "Album", album: true },
	play: async () => {
		const page = within(document.body);
		const button = await page.findByRole("button", { name: /Road trip/ });
		await expect(createAgent().snapshot()).toEqual(expect.arrayContaining([
			expect.objectContaining({ component: "button", label: expect.stringContaining("Road trip") }),
		]));
		button.focus();
		await userEvent.keyboard("{Enter}");
		await waitFor(() => expect(mocked(addPlaylistItem)).toHaveBeenCalledWith("p1", "album-1"));
		await expect(button).toHaveTextContent("1");
	},
};
export const LoadError: Story = {
	beforeEach: () => {
		mocked(getPlaylists).mockRejectedValue(new Error("offline"));
	},
};

export const CreateInteraction: Story = {
	play: async () => {
		const page = within(document.body);
		const name = await page.findByRole("textbox", { name: "Playlist Name" });
		const create = page.getByRole("button", { name: "Create" });
		await expect(create).toBeDisabled();
		await expect(name).toHaveAttribute("maxlength", "100");
		const agent = createAgent();
		const entries = agent.snapshot().filter((entry) => !entry.offPage);
		for (const label of ["Playlist Name", "Create", "Close"]) {
			await expect(entries.some((entry) => entry.label === label), label).toBe(true);
		}
		const result = await agent.act({ steps: [{ ref: "Playlist Name", action: "setValue", args: ["  Road music  "] }] });
		await expect(result.ok, result.error?.message).toBe(true);
		await userEvent.type(name, "{Enter}");
		await waitFor(() => expect(mocked(createPlaylist)).toHaveBeenCalledWith({ name: "Road music" }));
		await waitFor(() => expect(mocked(addPlaylistItem)).toHaveBeenCalledWith("new", "track-1"));
		await expect(name).toHaveValue("");
		await userEvent.click(page.getByRole("button", { name: "Close" }));
		await waitFor(() => expect(page.queryByRole("dialog")).not.toBeInTheDocument());
	},
};

export const ToggleInteraction: Story = {
	play: async () => {
		const page = within(document.body);
		const checkbox = await page.findByRole("checkbox", { name: /Road trip/ });
		await expect(checkbox).not.toBeChecked();
		checkbox.focus();
		await userEvent.keyboard(" ");
		await waitFor(() => expect(mocked(addPlaylistItem)).toHaveBeenCalledWith("p1", "track-1"));
		await expect(checkbox).toBeChecked();
		const agent = createAgent();
		const entry = agent.snapshot().find((item) => item.component === "checkbox" && item.label?.includes("Focus"));
		await expect(entry?.label).toBeTruthy();
		const result = await agent.act({ steps: [{ ref: entry!.ref, action: "setChecked", args: [false] }] });
		await expect(result.ok, result.error?.message).toBe(true);
		await waitFor(() => expect(mocked(removePlaylistItem)).toHaveBeenCalledWith("p2", "track-1"));
		await expect(page.getByRole("checkbox", { name: /Focus/ })).not.toBeChecked();
	},
};

export const ToggleFailure: Story = {
	beforeEach: () => { mocked(addPlaylistItem).mockRejectedValue(new Error("offline")); },
	play: async () => {
		const page = within(document.body);
		const checkbox = await page.findByRole("checkbox", { name: /Road trip/ });
		await userEvent.click(checkbox);
		await expect(await page.findByRole("alert")).toBeInTheDocument();
		await expect(checkbox).not.toBeChecked();
	},
};
