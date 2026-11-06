import type { Meta, StoryObj } from "@storybook/vue3-vite";
import ListSkeleton from "./ListSkeleton.vue";

const meta = {
	title: "UI/ListSkeleton",
	component: ListSkeleton,
	tags: ["autodocs"],
	args: { rows: 3 },
	decorators: [() => ({ template: '<div class="w-96"><story /></div>' })],
} satisfies Meta<typeof ListSkeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const ManyRows: Story = { args: { rows: 8 } };
