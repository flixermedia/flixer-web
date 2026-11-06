import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { fn, mocked } from "storybook/test";
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
