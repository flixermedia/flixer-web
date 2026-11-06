import type { Meta, StoryObj } from "@storybook/vue3-vite";
import CardGridSkeleton from "./CardGridSkeleton.vue";

const meta = {
	title: "UI/CardGridSkeleton",
	component: CardGridSkeleton,
	tags: ["autodocs"],
	parameters: { layout: "padded" },
	args: { count: 8, square: false },
} satisfies Meta<typeof CardGridSkeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Posters: Story = {};
export const SquareArtwork: Story = { args: { square: true } };
