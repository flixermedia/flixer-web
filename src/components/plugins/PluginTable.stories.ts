import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { withPluginContext } from "../../storybook/pluginContext";
import PluginTable from "./PluginTable.vue";

const meta = {
	title: "Plugins/PluginTable",
	component: PluginTable,
	tags: ["autodocs"],
	decorators: [withPluginContext()],
	args: {
		node: {
			type: "table",
			columns: [
				{ key: "name", label: "Name" },
				{ key: "size", label: "Size" },
				{ key: "status", label: "Status" },
				{ key: "actions", label: "" },
			],
			rows: [
				{ key: "1", cells: { name: "Dune.Part.Two.2024.mkv", size: 14200, status: { type: "badge", text: "Done", tone: "success" }, actions: { type: "button", label: "Remove", action: { op: "remove" }, variant: "danger" } } },
				{ key: "2", cells: { name: "Oppenheimer.2023.mkv", size: 11800, status: { type: "badge", text: "Queued", tone: "warning" }, actions: null } },
			],
		},
	},
} satisfies Meta<typeof PluginTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Empty: Story = { args: { node: { type: "table", columns: [{ key: "name", label: "Name" }], rows: [] } } };
export const EmptyCustomText: Story = { args: { node: { type: "table", columns: [{ key: "name", label: "Name" }], rows: [], emptyText: "Nothing downloading." } } };
