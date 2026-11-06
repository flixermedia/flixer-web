import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { mocked } from "storybook/test";
import { beginMethodSetup, getMyPayments } from "../../api";
import { installFakeStripe, mockPaymentData, myPayments } from "../../storybook/paymentsMocks";
import BillingSection from "./BillingSection.vue";

const meta = {
	title: "Payments/BillingSection",
	component: BillingSection,
	tags: ["autodocs"],
	parameters: { layout: "padded" },
	beforeEach: () => {
		mockPaymentData();
		mocked(beginMethodSetup).mockResolvedValue({ provider: "stripe", clientSecret: "seti_secret_storybook", client: { publishableKey: "pk_test_storybook" } });
		return installFakeStripe();
	},
} satisfies Meta<typeof BillingSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Empty: Story = {
	beforeEach: () => {
		mocked(getMyPayments).mockResolvedValue({ ...myPayments, methods: [], subscriptions: [], orders: [], entitlements: [] });
	},
};
export const LoadFails: Story = {
	beforeEach: () => {
		mocked(getMyPayments).mockRejectedValue(new Error("Network error"));
	},
};
