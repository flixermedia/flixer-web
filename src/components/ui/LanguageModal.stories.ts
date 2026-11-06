import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { modalStory } from "../../storybook/modalStory";
import LanguageModal from "./LanguageModal.vue";

const meta = {
	title: "UI/LanguageModal",
	component: LanguageModal,
	tags: ["autodocs"],
	parameters: { layout: "fullscreen" },
	render: (args) => modalStory(LanguageModal, args)(),
} satisfies Meta<typeof LanguageModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
