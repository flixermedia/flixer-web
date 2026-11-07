import type { Meta, StoryObj } from "@storybook/vue3-vite";
import LogsPanel from "./LogsPanel.vue";

const meta = {
	title: "Admin/LogsPanel",
	component: LogsPanel,
	tags: ["autodocs"],
	parameters: { layout: "padded" },
} satisfies Meta<typeof LogsPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const LoggingShortcut: Story = {};
