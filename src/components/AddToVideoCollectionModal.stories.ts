import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { closeModalsByGroup } from "@kolirt/vue-modal";
import { createAgent } from "@ui-sdk/vue/agent";
import { expect, mocked, userEvent, waitFor, within } from "storybook/test";
import { addVideoCollectionItem, createVideoCollection, getVideoCollections } from "../api/userMedia";
import { modalStory } from "../storybook/modalStory";
import AddToVideoCollectionModal from "./AddToVideoCollectionModal.vue";

const collection = { id: "c1", name: "Evening", description: null, isPublic: false, itemCount: 0, createdAt: "", updatedAt: "" };

const meta = {
	title: "Collections/AddToVideoCollectionModal",
	component: AddToVideoCollectionModal,
	parameters: { layout: "fullscreen" },
	args: { itemId: "video-1", title: "Movie" },
	render: (args) => modalStory(AddToVideoCollectionModal, args)(),
	beforeEach: () => {
		mocked(getVideoCollections).mockResolvedValue([]);
		mocked(createVideoCollection).mockResolvedValue(collection);
		mocked(addVideoCollectionItem).mockResolvedValue(undefined);
		return async () => { await closeModalsByGroup("default", { instantExit: true }); };
	},
} satisfies Meta<typeof AddToVideoCollectionModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const CreateInteraction: Story = {
	play: async () => {
		const page = within(document.body);
		const name = await page.findByRole("textbox", { name: "Collection name" });
		const create = page.getByRole("button", { name: "Create" });
		await expect(create).toBeDisabled();
		await expect(name).toHaveAttribute("maxlength", "100");
		const agent = createAgent();
		const result = await agent.act({ steps: [{ ref: "Collection name", action: "setValue", args: ["  Evening  "] }] });
		await expect(result.ok, result.error?.message).toBe(true);
		await userEvent.type(name, "{Enter}");
		await waitFor(() => expect(mocked(createVideoCollection)).toHaveBeenCalledWith({ name: "Evening" }));
		await waitFor(() => expect(mocked(addVideoCollectionItem)).toHaveBeenCalledWith("c1", "video-1"));
		await expect(name).toHaveValue("");
		await userEvent.click(page.getByRole("button", { name: "Close" }));
		await waitFor(() => expect(page.queryByRole("dialog")).not.toBeInTheDocument());
	},
};

export const AddExisting: Story = {
	beforeEach: () => { mocked(getVideoCollections).mockResolvedValue([{ ...collection }]); },
	play: async () => {
		const page = within(document.body);
		const button = await page.findByRole("button", { name: "Evening" });
		await expect(createAgent().snapshot()).toEqual(expect.arrayContaining([
			expect.objectContaining({ component: "button", label: "Evening" }),
		]));
		button.focus();
		await userEvent.keyboard(" ");
		await waitFor(() => expect(mocked(addVideoCollectionItem)).toHaveBeenCalledWith("c1", "video-1"));
		await expect(button).toBeDisabled();
	},
};
