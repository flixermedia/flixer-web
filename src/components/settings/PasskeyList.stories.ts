import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { fn } from "storybook/test";
import { passkeysFixture } from "../../storybook/fixturesAccount";
import PasskeyList from "./PasskeyList.vue";

const meta = {
	title: "Settings/PasskeyList",
	component: PasskeyList,
	tags: ["autodocs"],
	args: { passkeys: passkeysFixture, deletingId: null, onRemove: fn() },
} satisfies Meta<typeof PasskeyList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Deleting: Story = { args: { deletingId: "pk-1" } };
export const SinglePasskey: Story = { args: { passkeys: passkeysFixture.slice(0, 1) } };
