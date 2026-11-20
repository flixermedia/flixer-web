import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, userEvent } from "storybook/test";
import { ref } from "vue";
import AdminToggle from "./AdminToggle.vue";

const meta = {
	title: "Admin/AdminToggle",
	component: AdminToggle,
	tags: ["autodocs"],
	args: { label: "Allow registrations", description: "New users can sign up without an invite." },
	render: (args) => ({ components: { AdminToggle }, setup: () => ({ args, on: ref(true) }), template: '<AdminToggle v-bind="args" v-model="on" class="w-96" />' }),
} satisfies Meta<typeof AdminToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	play: async ({ canvas }) => {
		const toggle = canvas.getByRole("switch", { name: /Allow registrations/ });
		await expect(toggle).toBeChecked();
		await expect(toggle.getBoundingClientRect().width).toBe(44);
		await expect(toggle.getBoundingClientRect().height).toBe(24);
		await userEvent.click(canvas.getByText("Allow registrations"));
		await expect(toggle).not.toBeChecked();
		toggle.focus();
		await userEvent.keyboard(" ");
		await expect(toggle).toBeChecked();
	},
};
export const WithBadge: Story = { args: { badge: "Beta" } };
export const Compact: Story = { args: { compact: true } };
export const Controlled: Story = {
	render: (args) => ({
		components: { AdminToggle },
		setup: () => ({ args, on: ref(false), changes: ref(0) }),
		template: '<AdminToggle v-bind="args" v-model="on" @update:model-value="changes++" /><output data-testid="state">{{ on }}:{{ changes }}</output><button type="button" @click="on = true">Update externally</button>',
	}),
	play: async ({ canvas }) => {
		const toggle = canvas.getByRole("switch", { name: /Allow registrations/ });
		await userEvent.click(toggle);
		await expect(canvas.getByTestId("state")).toHaveTextContent("true:1");
		await userEvent.click(toggle);
		await expect(canvas.getByTestId("state")).toHaveTextContent("false:2");
		await userEvent.click(canvas.getByRole("button", { name: "Update externally" }));
		await expect(toggle).toBeChecked();
		await expect(canvas.getByTestId("state")).toHaveTextContent("true:2");
	},
};
export const Disabled: Story = {
	args: { disabled: true },
	play: async ({ canvas }) => {
		const toggle = canvas.getByRole("switch", { name: /Allow registrations/ });
		await expect(toggle).toBeDisabled();
		await userEvent.click(canvas.getByText("Allow registrations"));
		await expect(toggle).toBeChecked();
	},
};
