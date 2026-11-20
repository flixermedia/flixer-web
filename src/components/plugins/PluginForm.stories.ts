import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { createAgent } from "@ui-sdk/vue/agent";
import { expect, fn, userEvent } from "storybook/test";
import { withPluginContext } from "../../storybook/pluginContext";
import PluginForm from "./PluginForm.vue";

const runAction = fn(async () => true);

const meta = {
	title: "Plugins/PluginForm",
	component: PluginForm,
	tags: ["autodocs"],
	decorators: [withPluginContext({ run: runAction })],
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

export const Default: Story = {
	play: async ({ canvas }) => {
		const host = canvas.getByRole("textbox", { name: "Host" });
		const port = canvas.getByRole("spinbutton", { name: "Port" });
		const notes = canvas.getByRole("textbox", { name: "Notes" });
		const tls = canvas.getByRole("checkbox", { name: "Use TLS" });
		await expect(host).toHaveValue("localhost");
		await expect(port).toHaveValue(8080);
		await expect(notes).toHaveValue("");
		await expect(tls).not.toBeChecked();
		await userEvent.click(canvas.getByText("Host"));
		await expect(host).toHaveFocus();
		await userEvent.clear(host);
		await userEvent.type(host, "api.example.test");
		await userEvent.type(notes, "Primary endpoint");
		await userEvent.click(canvas.getByText("Use TLS"));
		tls.focus();
		await userEvent.keyboard(" ");
		await expect(tls).not.toBeChecked();
		await userEvent.keyboard(" ");
		await expect(tls).toBeChecked();
		const agent = createAgent();
		await expect(agent.snapshot().some((entry) => entry.component === "input" && entry.label === "Host")).toBe(true);
		await expect(agent.snapshot().some((entry) => entry.component === "button" && entry.label === "Save")).toBe(false);
		const result = await agent.act({ steps: [{ ref: "Host", action: "setValue", args: ["plugin.example.test"] }] });
		await expect(result.ok, result.error?.message).toBe(true);
		await expect(host).toHaveValue("plugin.example.test");
		await expect(tls).toBeChecked();
		await userEvent.click(canvas.getByRole("button", { name: "Save" }));
		await expect(runAction).toHaveBeenCalledWith(
			{ op: "save" },
			{ values: { host: "plugin.example.test", port: 8080, password: "", quality: "1080p", notes: "Primary endpoint", enabled: true, tls: true } },
		);
	},
};
export const FieldWithoutLabel: Story = {
	args: {
		node: {
			type: "form",
			submit: { label: "Save", action: { op: "save" } },
			fields: [{ name: "endpoint", type: "text", placeholder: "https://example.test" }],
		},
	},
	play: async ({ canvas }) => {
		const endpoint = canvas.getByRole("textbox", { name: "endpoint" });
		await expect(endpoint).toBeInTheDocument();
	},
};
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
