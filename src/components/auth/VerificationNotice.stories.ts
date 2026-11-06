import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { fn } from "storybook/test";
import VerificationNotice from "./VerificationNotice.vue";

const meta = {
	title: "Auth/VerificationNotice",
	component: VerificationNotice,
	tags: ["autodocs"],
	args: { email: "jane@example.com", onBack: fn() },
} satisfies Meta<typeof VerificationNotice>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
