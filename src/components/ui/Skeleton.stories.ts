import type { Meta, StoryObj } from "@storybook/vue3-vite";
import Skeleton from "./Skeleton.vue";

const meta = {
	title: "UI/Skeleton",
	component: Skeleton,
	tags: ["autodocs"],
	args: { label: false },
	render: (args) => ({ components: { Skeleton }, setup: () => ({ args }), template: '<Skeleton v-bind="args" class="h-24 w-64" />' }),
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const AnnouncedToScreenReaders: Story = { args: { label: true } };
