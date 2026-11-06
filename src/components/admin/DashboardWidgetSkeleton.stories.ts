import type { Meta, StoryObj } from "@storybook/vue3-vite";
import DashboardWidgetSkeleton from "./DashboardWidgetSkeleton.vue";

const meta = {
	title: "Admin/DashboardWidgetSkeleton",
	component: DashboardWidgetSkeleton,
	tags: ["autodocs"],
	args: { widget: "stats" },
	argTypes: { widget: { control: "select", options: ["stats", "server", "storage", "activity", "uptime", "streams", "transcoding", "libraries", "content-mix", "queues", "services", "updates", "backups", "logs", "requests", "users", "shortcuts"] } },
	render: (args) => ({ components: { DashboardWidgetSkeleton }, setup: () => ({ args }), template: '<div class="h-48 w-96"><DashboardWidgetSkeleton v-bind="args" /></div>' }),
} satisfies Meta<typeof DashboardWidgetSkeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Stats: Story = {};
export const Activity: Story = { args: { widget: "activity" } };
export const Updates: Story = { args: { widget: "updates" } };
export const Shortcuts: Story = { args: { widget: "shortcuts" } };
