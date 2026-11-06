import type { Meta, StoryObj } from "@storybook/vue3-vite";
import AudioBitrateSelect from "./AudioBitrateSelect.vue";

const meta = {
	title: "Player/AudioBitrateSelect",
	component: AudioBitrateSelect,
	tags: ["autodocs"],
	args: { compact: false },
} satisfies Meta<typeof AudioBitrateSelect>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Compact: Story = { args: { compact: true } };
