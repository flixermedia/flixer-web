import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { withPluginContext } from "../../storybook/pluginContext";
import PluginSection from "./PluginSection.vue";

const meta = {
	title: "Plugins/PluginSection",
	component: PluginSection,
	tags: ["autodocs"],
	decorators: [withPluginContext()],
	args: {
		node: {
			type: "section",
			title: "Downloads",
			description: "Manage your download client connection.",
			actions: [{ type: "button", label: "Test connection", action: { op: "test" }, variant: "quiet" }],
			children: [
				{ type: "text", text: "Connected to qBittorrent 4.6." },
				{ type: "alert", text: "Disk space is running low.", tone: "warning" },
			],
		},
	},
} satisfies Meta<typeof PluginSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const BodyOnly: Story = { args: { node: { type: "section", children: [{ type: "text", text: "No header, just content." }] } } };
