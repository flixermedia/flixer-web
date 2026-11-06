import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { mocked } from "storybook/test";
import { unlockAccess } from "../../api";
import { modalStory } from "../../storybook/modalStory";
import UnlockModal from "./UnlockModal.vue";

const meta = {
	title: "Access/UnlockModal",
	component: UnlockModal,
	tags: ["autodocs"],
	parameters: { layout: "fullscreen" },
	render: () => modalStory(UnlockModal)(),
} satisfies Meta<typeof UnlockModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WrongPin: Story = {
	beforeEach: () => {
		mocked(unlockAccess).mockRejectedValue(new Error("Wrong PIN"));
	},
};
