import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { modalStory } from "../storybook/modalStory";
import DeclineRequestModal from "./DeclineRequestModal.vue";

const meta = {
	title: "Requests/DeclineRequestModal",
	component: DeclineRequestModal,
	tags: ["autodocs"],
	parameters: { layout: "fullscreen" },
	args: { title: "Dune: Part Two" },
	render: (args) => modalStory(DeclineRequestModal, args)(),
} satisfies Meta<typeof DeclineRequestModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
