import type { Meta, StoryObj } from "@storybook/vue3-vite";
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
		template: '<TextInput v-bind="args" v-model="value" placeholder="Jane Doe" class="w-80" />',
	}),
} satisfies Meta<typeof TextInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	play: async ({ canvas }) => {
		const input = canvas.getByPlaceholderText("Jane Doe");
		await userEvent.type(input, "Ada");
		await expect(input).toHaveValue("Ada");
	},
};
export const WithoutHint: Story = { args: { hint: undefined } };
export const Disabled: Story = {
	render: (args) => ({ components: { TextInput }, setup: () => ({ args }), template: '<TextInput v-bind="args" model-value="Locked" disabled class="w-80" />' }),
};
