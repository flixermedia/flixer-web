import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { modalStory } from "../../storybook/modalStory";
import ThemeModal from "./ThemeModal.vue";

const meta = {
	title: "UI/ThemeModal",
	component: ThemeModal,
	tags: ["autodocs"],
	parameters: { layout: "fullscreen" },
	render: (args) => modalStory(ThemeModal, args)(),
} satisfies Meta<typeof ThemeModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
