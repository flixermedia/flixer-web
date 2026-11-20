import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { createAgent } from "@ui-sdk/vue/agent";
import { expect, fn, userEvent } from "storybook/test";
import { withPluginContext } from "../../storybook/pluginContext";
import PluginButton from "./PluginButton.vue";

const meta = {
	title: "Plugins/PluginButton",
	component: PluginButton,
	tags: ["autodocs"],
	decorators: [withPluginContext()],
	args: { node: { type: "button", label: "Sync now", action: { op: "sync" }, variant: "primary" } },
} satisfies Meta<typeof PluginButton>;

export default meta;
type Story = StoryObj<typeof meta>;

const run = fn(async () => true);
export const Primary: Story = {
	decorators: [withPluginContext({ run })],
	play: async ({ canvas }) => {
		const button = canvas.getByRole("button", { name: "Sync now" });
		await expect(createAgent().snapshot().some((entry) => entry.label === "Sync now")).toBe(false);
		await expect(run).not.toHaveBeenCalled();
		button.focus();
		await userEvent.keyboard("{Enter}");
		await expect(run).toHaveBeenCalledWith({ op: "sync" }, { confirm: undefined, danger: false });
	},
};
export const Quiet: Story = { args: { node: { type: "button", label: "Refresh", action: { op: "refresh" }, variant: "quiet" } } };
export const Danger: Story = { args: { node: { type: "button", label: "Remove", action: { op: "remove" }, variant: "danger", confirm: "Remove this item?" } } };
export const Disabled: Story = { args: { node: { type: "button", label: "Unavailable", action: { op: "noop" }, disabled: true } } };
