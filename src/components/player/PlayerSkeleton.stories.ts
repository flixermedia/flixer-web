import type { Meta, StoryObj } from "@storybook/vue3-vite";
import PlayerSkeleton from "./PlayerSkeleton.vue";

const meta = {
	title: "Player/PlayerSkeleton",
	component: PlayerSkeleton,
	tags: ["autodocs"],
	parameters: { layout: "fullscreen" },
} satisfies Meta<typeof PlayerSkeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
