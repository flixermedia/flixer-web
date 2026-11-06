import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { fn } from "storybook/test";
import PasskeySecondFactor from "./PasskeySecondFactor.vue";

const meta = {
	title: "Auth/PasskeySecondFactor",
	component: PasskeySecondFactor,
	tags: ["autodocs"],
	args: { isSubmitting: false, onVerify: fn(), onBack: fn() },
} satisfies Meta<typeof PasskeySecondFactor>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Submitting: Story = { args: { isSubmitting: true } };
