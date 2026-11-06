import type { Meta, StoryObj } from "@storybook/vue3-vite";
import ClampedText from "./ClampedText.vue";

const paragraph = "A long synopsis that keeps going so the clamp has something to cut off. ";

const meta = {
	title: "UI/ClampedText",
	component: ClampedText,
	tags: ["autodocs"],
	args: { title: "Synopsis", text: paragraph.repeat(12) },
	decorators: [() => ({ template: '<div class="w-96"><story /></div>' })],
} satisfies Meta<typeof ClampedText>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overflowing: Story = {};
export const Short: Story = { args: { text: "Short enough to fit." } };
