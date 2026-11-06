import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { modalStory } from "../../storybook/modalStory";
import AddWidgetModal from "./AddWidgetModal.vue";

const meta = {
	title: "Admin/AddWidgetModal",
	component: AddWidgetModal,
	tags: ["autodocs"],
	parameters: { layout: "fullscreen" },
	args: { added: ["stats", "storage"] },
	render: (args) => modalStory(AddWidgetModal, args)(),
} satisfies Meta<typeof AddWidgetModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const NothingAdded: Story = { args: { added: [] } };
