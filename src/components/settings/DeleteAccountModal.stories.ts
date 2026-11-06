import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { mocked } from "storybook/test";
import { deleteAccount } from "../../api";
import { modalStory } from "../../storybook/modalStory";
import DeleteAccountModal from "./DeleteAccountModal.vue";

const meta = {
	title: "Settings/DeleteAccountModal",
	component: DeleteAccountModal,
	tags: ["autodocs"],
	parameters: { layout: "fullscreen" },
	beforeEach: () => {
		mocked(deleteAccount).mockResolvedValue(undefined as never);
	},
	render: (args) => modalStory(DeleteAccountModal, args)(),
} satisfies Meta<typeof DeleteAccountModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const DeletionFails: Story = {
	beforeEach: () => {
		mocked(deleteAccount).mockRejectedValue(new Error("Incorrect password."));
	},
};
