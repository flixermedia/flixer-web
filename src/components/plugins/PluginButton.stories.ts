import type { Meta, StoryObj } from "@storybook/vue3-vite";
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

export const Primary: Story = {};
export const Quiet: Story = { args: { node: { type: "button", label: "Refresh", action: { op: "refresh" }, variant: "quiet" } } };
export const Danger: Story = { args: { node: { type: "button", label: "Remove", action: { op: "remove" }, variant: "danger", confirm: "Remove this item?" } } };
export const Disabled: Story = { args: { node: { type: "button", label: "Unavailable", action: { op: "noop" }, disabled: true } } };
