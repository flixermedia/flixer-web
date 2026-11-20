import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, fn, mocked, waitFor, within } from "storybook/test";
import { createMediaLibrary, updateMediaLibrary } from "../../api";
import { mediaLibrary } from "../../storybook/fixturesMediaAdmin";
import MediaLibraryForm from "./MediaLibraryForm.vue";

const meta = {
	title: "Admin/MediaLibraryForm",
	component: MediaLibraryForm,
	tags: ["autodocs"],
	args: { onSaved: fn(), onCancel: fn() },
	decorators: [() => ({ template: '<div class="w-[480px]"><story /></div>' })],
	beforeEach: () => {
		mocked(createMediaLibrary).mockResolvedValue(mediaLibrary);
		mocked(updateMediaLibrary).mockResolvedValue(mediaLibrary);
	},
} satisfies Meta<typeof MediaLibraryForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Create: Story = {};
export const Edit: Story = { args: { library: mediaLibrary } };
export const SaveError: Story = {
	args: { library: mediaLibrary },
	beforeEach: () => {
		mocked(updateMediaLibrary).mockRejectedValue(new Error("Folder is already used by another library"));
	},
};

export const RenameWithKeyboard: Story = {
	args: { library: mediaLibrary },
	play: async ({ canvas, userEvent }) => {
		const name = canvas.getByRole("textbox", { name: "Name" });
		await expect(name).toBeRequired();
		await userEvent.clear(name);
		await expect(canvas.getByRole("button", { name: /save/i })).toBeDisabled();
		await userEvent.type(name, "  New library  {Enter}");
		await waitFor(() => expect(mocked(updateMediaLibrary)).toHaveBeenCalledWith(mediaLibrary.id, {
			name: "New library", type: "movies", imageStorage: "cache", folders: [{ rootId: "root-media", path: "Movies" }],
		}));
	},
};

export const ChangeOptions: Story = {
	args: { library: { ...mediaLibrary, type: "movies", imageStorage: "cache" } },
	play: async ({ canvas, userEvent }) => {
		const changeToOption = async (label: string, option: RegExp) => {
			const select = canvas.getByRole("combobox", { name: label });
			await userEvent.click(select);
			await userEvent.click(await within(document.body).findByRole("option", { name: option }));
		};
		await changeToOption("Content Type", /tv/i);
		await changeToOption("Artwork Storage", /alongside/i);
		await userEvent.click(canvas.getByRole("button", { name: /save/i }));
		await waitFor(() => expect(mocked(updateMediaLibrary)).toHaveBeenCalledWith(mediaLibrary.id, {
			name: mediaLibrary.name, type: "tvshows", imageStorage: "alongside",
			folders: [{ rootId: "root-media", path: "Movies" }],
		}));
	},
};
