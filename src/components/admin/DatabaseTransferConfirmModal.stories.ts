import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { modalStory } from "../../storybook/modalStory";
import DatabaseTransferConfirmModal from "./DatabaseTransferConfirmModal.vue";

const meta = {
	title: "Admin/DatabaseTransferConfirmModal",
	component: DatabaseTransferConfirmModal,
	tags: ["autodocs"],
	parameters: { layout: "fullscreen" },
	render: (args) => modalStory(DatabaseTransferConfirmModal, args)(),
} satisfies Meta<typeof DatabaseTransferConfirmModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
