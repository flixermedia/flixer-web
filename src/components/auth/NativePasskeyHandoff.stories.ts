import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { mocked } from "storybook/test";
import { getNativePasskeyHandoffOptions } from "../../api";
import NativePasskeyHandoff from "./NativePasskeyHandoff.vue";

const meta = {
	title: "Auth/NativePasskeyHandoff",
	component: NativePasskeyHandoff,
	tags: ["autodocs"],
	args: { handoffId: "handoff-123", state: "state-abc" },
} satisfies Meta<typeof NativePasskeyHandoff>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const OptionsFailed: Story = {
	beforeEach: () => {
		mocked(getNativePasskeyHandoffOptions).mockRejectedValue(new Error("expired"));
	},
};
