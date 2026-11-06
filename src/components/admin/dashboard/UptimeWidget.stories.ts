import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { adminOverview } from "../../../storybook/fixturesAdmin";
import UptimeWidget from "./UptimeWidget.vue";

const meta = {
	title: "Admin/Dashboard/UptimeWidget",
	component: UptimeWidget,
	tags: ["autodocs"],
	args: { overview: adminOverview },
	render: (args) => ({ components: { UptimeWidget }, setup: () => ({ args }), template: '<div class="w-72"><UptimeWidget v-bind="args" /></div>' }),
} satisfies Meta<typeof UptimeWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const JustRestarted: Story = { args: { overview: { ...adminOverview, server: { ...adminOverview.server, uptimeSeconds: 95 } } } };
