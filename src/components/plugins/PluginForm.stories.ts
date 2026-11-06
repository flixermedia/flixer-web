import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { withPluginContext } from "../../storybook/pluginContext";
import PluginForm from "./PluginForm.vue";

const meta = {
	title: "Plugins/PluginForm",
	component: PluginForm,
	tags: ["autodocs"],
	decorators: [withPluginContext()],
	parameters: { layout: "padded" },
	args: {
		node: {
			type: "form",
			submit: { label: "Save", action: { op: "save" } },
			fields: [
				{ name: "host", label: "Host", type: "text", value: "localhost", required: true, help: "Hostname of the server." },
				{ name: "port", label: "Port", type: "number", value: 8080, min: 1, max: 65535 },
				{ name: "password", label: "Password", type: "password", hasValue: true },
				{
					name: "quality",
					label: "Quality",
					type: "select",
					value: "1080p",
					options: [
						{ value: "720p", label: "720p" },
						{ value: "1080p", label: "1080p" },
					],
				},
				{ name: "notes", label: "Notes", type: "textarea", placeholder: "Optional notes" },
				{ name: "enabled", label: "Enabled", type: "switch", value: true, help: "Turn the integration on or off." },
				{ name: "tls", label: "Use TLS", type: "checkbox", value: false },
			],
		},
	},
} satisfies Meta<typeof PluginForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Inline: Story = {
	args: {
		node: {
			type: "form",
			layout: "inline",
			submit: { label: "Search", action: { op: "search" }, variant: "quiet" },
			fields: [{ name: "q", label: "Query", type: "text", placeholder: "Search…" }],
		},
	},
};
