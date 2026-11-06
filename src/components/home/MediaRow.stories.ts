import type { Meta, StoryObj } from "@storybook/vue3-vite";
import MediaCard from "./MediaCard.vue";
import MediaRow from "./MediaRow.vue";

const meta = {
	title: "Home/MediaRow",
	component: MediaRow,
	tags: ["autodocs"],
	parameters: { layout: "fullscreen" },
	args: { title: "Continue watching" },
	render: (args) => ({
		components: { MediaRow, MediaCard },
		setup: () => ({ args }),
		template: '<MediaRow v-bind="args"><li v-for="n in 12" :key="n" class="w-40 shrink-0"><MediaCard :title="`Title ${n}`" subtitle="2024" /></li></MediaRow>',
	}),
} satisfies Meta<typeof MediaRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
