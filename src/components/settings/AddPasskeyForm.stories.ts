import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { fn } from "storybook/test";
import AddPasskeyForm from "./AddPasskeyForm.vue";

const meta = {
	title: "Settings/AddPasskeyForm",
	component: AddPasskeyForm,
	tags: ["autodocs"],
	parameters: { layout: "padded" },
	args: { isRegistering: false, onAdd: fn() },
} satisfies Meta<typeof AddPasskeyForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Registering: Story = { args: { isRegistering: true } };
