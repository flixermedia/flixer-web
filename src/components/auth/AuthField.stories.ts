import type { Meta, StoryObj } from "@storybook/vue3-vite";
import AuthField from "./AuthField.vue";

const meta = {
	title: "Auth/AuthField",
	component: AuthField,
	tags: ["autodocs"],
	args: { id: "email", label: "Email" },
	render: (args) => ({
		components: { AuthField },
		setup: () => ({ args }),
		template: '<AuthField v-bind="args" class="w-80"><input :id="args.id" class="h-full w-full bg-transparent px-4 outline-none" placeholder="you@example.com" /></AuthField>',
	}),
} satisfies Meta<typeof AuthField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
