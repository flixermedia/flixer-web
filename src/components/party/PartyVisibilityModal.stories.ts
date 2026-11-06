import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { modalStory } from "../../storybook/modalStory";
import PartyVisibilityModal from "./PartyVisibilityModal.vue";

const meta = {
	title: "Party/PartyVisibilityModal",
	component: PartyVisibilityModal,
	tags: ["autodocs"],
	parameters: { layout: "fullscreen" },
	render: () => modalStory(PartyVisibilityModal)(),
} satisfies Meta<typeof PartyVisibilityModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
