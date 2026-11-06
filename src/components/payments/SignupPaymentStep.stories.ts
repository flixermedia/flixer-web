import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { fn, mocked } from "storybook/test";
import { beginSignupSetup } from "../../api";
import { activePaymentStatus, installFakeStripe, mockPaymentHelpers, setPaymentStatus } from "../../storybook/paymentsMocks";
import SignupPaymentStep from "./SignupPaymentStep.vue";

const meta = {
	title: "Payments/SignupPaymentStep",
	component: SignupPaymentStep,
	tags: ["autodocs"],
	decorators: [() => ({ template: '<div class="w-96"><story /></div>' })],
	args: { token: "signup-token", name: "Ada Lovelace", email: "ada@example.com", onPaid: fn(), onExpired: fn(), onBack: fn() },
	beforeEach: async () => {
		mockPaymentHelpers();
		mocked(beginSignupSetup).mockResolvedValue({ provider: "stripe", clientSecret: "seti_secret_storybook", client: { publishableKey: "pk_test_storybook" }, setupToken: "setup-token" });
		await setPaymentStatus();
		return installFakeStripe();
	},
} satisfies Meta<typeof SignupPaymentStep>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithFee: Story = {};
export const CardOnly: Story = {
	beforeEach: async () => {
		await setPaymentStatus({ ...activePaymentStatus, registration: { ...activePaymentStatus.registration, feeEnabled: false } });
	},
};
export const SetupFails: Story = {
	beforeEach: () => {
		mocked(beginSignupSetup).mockRejectedValue(new Error("Setup failed"));
	},
};
