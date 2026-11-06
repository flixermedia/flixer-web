import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { fn } from "storybook/test";
import { installFakeStripe } from "../../storybook/paymentsMocks";
import CardElement from "./CardElement.vue";

const meta = {
	title: "Payments/CardElement",
	component: CardElement,
	tags: ["autodocs"],
	parameters: { layout: "padded" },
	decorators: [() => ({ template: '<div class="w-96"><story /></div>' })],
	args: { setup: { provider: "stripe", clientSecret: "seti_secret_storybook", client: { publishableKey: "pk_test_storybook" } }, name: "Ada Lovelace", email: "ada@example.com", onReady: fn(), onChange: fn(), onFailed: fn() },
	beforeEach: () => installFakeStripe(),
} satisfies Meta<typeof CardElement>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Ready: Story = {};
export const WaitingForSetup: Story = { args: { setup: null } };
export const SdkFailed: Story = { beforeEach: () => installFakeStripe({ fail: true }) };
