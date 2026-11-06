import type { Meta, StoryObj } from "@storybook/vue3-vite";
import HomeSkeleton from "./HomeSkeleton.vue";

const meta = {
	title: "Home/HomeSkeleton",
	component: HomeSkeleton,
	tags: ["autodocs"],
	parameters: { layout: "fullscreen" },
	args: { rows: 3 },
} satisfies Meta<typeof HomeSkeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
