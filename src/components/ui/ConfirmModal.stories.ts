import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { modalStory } from "../../storybook/modalStory";
import ConfirmModal from "./ConfirmModal.vue";

const meta = {
	title: "UI/ConfirmModal",
	component: ConfirmModal,
	tags: ["autodocs"],
	parameters: { layout: "fullscreen" },
	args: { message: "This cannot be undone." },
	render: (args) => modalStory(ConfirmModal, args)(),
} satisfies Meta<typeof ConfirmModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Danger: Story = { args: { title: "Delete library?", confirmLabel: "Delete", danger: true } };
