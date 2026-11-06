import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { withPluginContext } from "../../storybook/pluginContext";
import PluginNode from "./PluginNode.vue";

const meta = {
	title: "Plugins/PluginNode",
	component: PluginNode,
	tags: ["autodocs"],
	decorators: [withPluginContext()],
	parameters: { layout: "padded" },
	args: { node: { type: "text", text: "Plain text node" } },
} satisfies Meta<typeof PluginNode>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Text: Story = {};
export const Heading: Story = { args: { node: { type: "heading", text: "Plugin heading", level: 2 } } };
export const Alert: Story = { args: { node: { type: "alert", text: "Something needs your attention.", tone: "warning" } } };
export const Empty: Story = { args: { node: { type: "empty", text: "Nothing to show yet." } } };
export const Chips: Story = {
	args: {
		node: {
			type: "chips",
			param: "status",
			value: "all",
			options: [
				{ value: "all", label: "All" },
				{ value: "active", label: "Active" },
			],
		},
	},
};
export const Searchbox: Story = { args: { node: { type: "searchbox", param: "q", placeholder: "Search plugins" } } };
export const Pager: Story = { args: { node: { type: "pager", param: "page", page: 2, pageSize: 20, total: 95 } } };
export const Stack: Story = {
	args: {
		node: {
			type: "stack",
			direction: "row",
			gap: 2,
			children: [{ type: "badge", text: "New", tone: "success" }, { type: "link", label: "Details", to: { query: { id: "1" }, merge: true } }, { type: "divider" }, { type: "button", label: "Run", action: { op: "run" }, variant: "primary" }],
		},
	},
};
export const Tabs: Story = {
	args: {
		node: {
			type: "tabs",
			param: "tab",
			tabs: [
				{ id: "a", label: "First", children: [{ type: "text", text: "First tab content" }] },
				{ id: "b", label: "Second", children: [{ type: "text", text: "Second tab content" }] },
			],
		},
	},
};
