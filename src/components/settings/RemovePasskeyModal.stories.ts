import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { mocked } from "storybook/test";
import { deletePasskey } from "../../api";
import { modalStory } from "../../storybook/modalStory";
import RemovePasskeyModal from "./RemovePasskeyModal.vue";

const meta = {
	title: "Settings/RemovePasskeyModal",
	component: RemovePasskeyModal,
	tags: ["autodocs"],
	parameters: { layout: "fullscreen" },
	args: { passkeyId: "pk-1", passkeyName: "MacBook Touch ID" },
	beforeEach: () => {
		mocked(deletePasskey).mockResolvedValue(undefined as never);
	},
	render: (args) => modalStory(RemovePasskeyModal, args)(),
} satisfies Meta<typeof RemovePasskeyModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Fails: Story = {
	beforeEach: () => {
		mocked(deletePasskey).mockRejectedValue(new Error("Incorrect password."));
	},
};
