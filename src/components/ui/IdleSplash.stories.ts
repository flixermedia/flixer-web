import type { Meta, StoryObj } from "@storybook/vue3-vite";
import IdleSplash from "./IdleSplash.vue";

const meta = {
	title: "UI/IdleSplash",
	component: IdleSplash,
	tags: ["autodocs"],
	parameters: { layout: "fullscreen" },
} satisfies Meta<typeof IdleSplash>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
