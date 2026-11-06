import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { modalStory } from "../../storybook/modalStory";
import TextModal from "./TextModal.vue";

const meta = {
	title: "UI/TextModal",
	component: TextModal,
	tags: ["autodocs"],
	parameters: { layout: "fullscreen" },
	args: { title: "Synopsis", text: "A retired detective is pulled back into the city he left behind when an old case resurfaces with a new body." },
	render: (args) => modalStory(TextModal, args)(),
} satisfies Meta<typeof TextModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
