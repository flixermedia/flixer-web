import type { Meta, StoryObj } from "@storybook/vue3-vite";
import ShortcutsWidget from "./ShortcutsWidget.vue";

const meta = {
	title: "Admin/Dashboard/ShortcutsWidget",
	component: ShortcutsWidget,
	tags: ["autodocs"],
	decorators: [() => ({ template: '<div class="h-56 w-96"><story /></div>' })],
} satisfies Meta<typeof ShortcutsWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
