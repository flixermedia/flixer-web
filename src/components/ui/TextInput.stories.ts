import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { createAgent } from "@ui-sdk/vue/agent";
import { ref } from "vue";
import { expect, userEvent } from "storybook/test";
import TextInput from "./TextInput.vue";

const meta = {
	title: "UI/TextInput",
	component: TextInput,
	tags: ["autodocs"],
	args: { label: "Display name", hint: "Shown to other members of your server." },
	render: (args) => ({
		components: { TextInput },
		setup: () => ({ args, value: ref("") }),
		template: '<TextInput v-bind="args" v-model="value" placeholder="Jane Doe" class="w-80" /><output data-testid="value">{{ value }}</output>',
	}),
} satisfies Meta<typeof TextInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	play: async ({ canvas }) => {
		const input = canvas.getByRole("textbox", { name: "Display name" });
		await expect(input).toHaveAccessibleDescription("Shown to other members of your server.");
		await userEvent.type(input, "Ada");
		await expect(input).toHaveValue("Ada");
		await expect(canvas.getByTestId("value")).toHaveTextContent("Ada");
		const agent = createAgent();
		await expect(agent.snapshot().some((entry) => entry.component === "input" && entry.label === "Display name")).toBe(true);
		await agent.act({ steps: [{ ref: "Display name", action: "setValue", args: ["Grace"] }] });
		await expect(input).toHaveValue("Grace");
		await expect(canvas.getByTestId("value")).toHaveTextContent("Grace");
	},
};
export const WithoutHint: Story = { args: { hint: undefined } };
export const Disabled: Story = {
	render: (args) => ({ components: { TextInput }, setup: () => ({ args }), template: '<TextInput v-bind="args" model-value="Locked" disabled class="w-80" />' }),
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("textbox", { name: "Display name" })).toBeDisabled();
	},
};
export const Trimmed: Story = {
	render: (args) => ({
		components: { TextInput },
		setup: () => ({ args, value: ref("") }),
		template: '<form><TextInput v-bind="args" v-model.trim="value" name="displayName" required class="w-80" /><output data-testid="value">{{ value }}</output><button type="button" @click="value = \'Updated\'">Update externally</button></form>',
	}),
	play: async ({ canvas }) => {
		const input = canvas.getByRole("textbox", { name: "Display name" });
		await expect(input).toBeInvalid();
		await userEvent.type(input, "  Ada Lovelace  ");
		await expect(canvas.getByTestId("value")).toHaveTextContent("Ada Lovelace");
		await expect(input).toHaveAttribute("name", "displayName");
		await expect(input).toBeRequired();
		await userEvent.tab();
		await expect(input).toHaveValue("Ada Lovelace");
		await userEvent.click(canvas.getByRole("button", { name: "Update externally" }));
		await expect(input).toHaveValue("Updated");
	},
};
export const Password: Story = {
	render: (args) => ({ components: { TextInput }, setup: () => ({ args }), template: '<TextInput v-bind="args" label="Password" type="password" model-value="example-password" />' }),
	play: async ({ canvas }) => {
		const input = canvas.getByLabelText("Password");
		await expect(input).toHaveAttribute("type", "password");
		await expect(input).toHaveValue("example-password");
		const agent = createAgent();
		await expect(JSON.stringify(agent.snapshot())).not.toContain("example-password");
	},
};
