import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { createAgent } from "@ui-sdk/vue/agent";
import { expect, fn, userEvent } from "storybook/test";
import { ref } from "vue";
import { withPluginContext } from "../../storybook/pluginContext";
import PluginNode from "./PluginNode.vue";

const patchQuery = fn();
const tabQuery = ref<Record<string, string>>({ tab: "a" });

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
export const Searchbox: Story = {
	args: { node: { type: "searchbox", param: "q", placeholder: "Search plugins" } },
	decorators: [withPluginContext({ patchQuery })],
	play: async ({ canvas }) => {
		const search = canvas.getByRole("searchbox", { name: "Search plugins" });
		const agent = createAgent();
		await expect(agent.snapshot().some((entry) => entry.component === "input" && entry.label === "Search plugins")).toBe(true);
		const result = await agent.act({ steps: [{ ref: "Search plugins", action: "setValue", args: ["agent query"] }] });
		await expect(result.ok, result.error?.message).toBe(true);
		await expect(search).toHaveValue("agent query");
		await userEvent.clear(search);
		await userEvent.type(search, "subtitle");
		await userEvent.keyboard("{Enter}");
		await expect(patchQuery).toHaveBeenCalledWith({ q: "subtitle" }, undefined);
	},
};
export const Pager: Story = {
	args: { node: { type: "pager", param: "page", page: 1, pageSize: 20, total: 95 } },
	decorators: [withPluginContext({ patchQuery })],
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("button", { name: "Previous" })).toBeDisabled();
		const result = await createAgent().act({ steps: [{ ref: "Next", action: "press" }] });
		await expect(result.ok, result.error?.message).toBe(true);
		await expect(patchQuery).toHaveBeenCalledWith({ page: "2" });
	},
};
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
			reset: ["page"],
			tabs: [
				{ id: "a", label: "First", children: [{ type: "text", text: "First tab content" }] },
				{ id: "b", label: "Second", children: [{ type: "text", text: "Second tab content" }] },
			],
		},
	},
	beforeEach: () => { tabQuery.value = { tab: "a" }; },
	decorators: [withPluginContext({
		query: tabQuery,
		patchQuery: (patch, reset) => {
			patchQuery(patch, reset);
			tabQuery.value = { ...tabQuery.value, ...patch };
		},
	})],
	play: async ({ canvas }) => {
		const first = canvas.getByRole("tab", { name: "First" });
		const second = canvas.getByRole("tab", { name: "Second" });
		await expect(canvas.getByRole("tabpanel", { name: "First" })).toHaveTextContent("First tab content");
		first.focus();
		await userEvent.keyboard("{ArrowRight}");
		await expect(second).toHaveFocus();
		await expect(patchQuery).not.toHaveBeenCalled();
		await userEvent.keyboard("{Enter}");
		await expect(patchQuery).toHaveBeenCalledWith({ tab: "b" }, ["page"]);
		await expect(canvas.getByRole("tabpanel", { name: "Second" })).toHaveTextContent("Second tab content");
	},
};
