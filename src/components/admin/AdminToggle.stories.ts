import type { Meta, StoryObj } from "@storybook/vue3-vite";
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

export const Default: Story = {};
export const WithBadge: Story = { args: { badge: "Beta" } };
export const Compact: Story = { args: { compact: true } };
export const Disabled: Story = { args: { disabled: true } };
