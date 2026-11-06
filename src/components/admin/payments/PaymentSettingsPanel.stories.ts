import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { mocked } from "storybook/test";
import { getAdminPaymentConfig, getPaymentStats, listPaymentCurrencies, listPlans, searchPaymentScopes, testPaymentConnection, updateAdminPaymentConfig } from "../../../api";
import { currenciesFixture, paymentConfigFixture, paymentStatsFixture } from "../../../storybook/fixturesPaymentsAdmin";
import { plansFixture, restorePaymentHelpers } from "../../../storybook/fixturesPayments";
import PaymentSettingsPanel from "./PaymentSettingsPanel.vue";

const meta = {
	title: "Admin/Payments/PaymentSettingsPanel",
	component: PaymentSettingsPanel,
	tags: ["autodocs"],
	parameters: { layout: "padded" },
	beforeEach: () => {
		restorePaymentHelpers();
		mocked(getAdminPaymentConfig).mockResolvedValue(paymentConfigFixture);
		mocked(updateAdminPaymentConfig).mockResolvedValue(paymentConfigFixture);
		mocked(listPaymentCurrencies).mockResolvedValue(currenciesFixture);
		mocked(listPlans).mockResolvedValue(plansFixture);
		mocked(getPaymentStats).mockResolvedValue(paymentStatsFixture);
		mocked(testPaymentConnection).mockResolvedValue({ ok: true, detail: "Connected to Stripe (test mode)" });
		mocked(searchPaymentScopes).mockResolvedValue({ items: [], artists: [] });
	},
} satisfies Meta<typeof PaymentSettingsPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const NotConfigured: Story = {
	beforeEach: () => {
		mocked(getAdminPaymentConfig).mockResolvedValue({
			...paymentConfigFixture,
			enabled: false,
			provider: null,
			currencies: ["USD"],
			enabledAt: null,
			tax: { enabled: false, inclusive: false, rates: [] },
			stripe: { publishableKey: "", secretKey: "", webhookSecret: "" },
		});
		mocked(getPaymentStats).mockRejectedValue(new Error("Payments are off"));
	},
};
export const Square: Story = {
	beforeEach: () => {
		mocked(getAdminPaymentConfig).mockResolvedValue({
			...paymentConfigFixture,
			provider: "square",
			square: { environment: "sandbox", applicationId: "sandbox-sq0idb-abc", locationId: "L123", accessToken: "********", signatureKey: "", webhookUrl: "" },
		});
	},
};
export const Loading: Story = {
	beforeEach: () => {
		mocked(getAdminPaymentConfig).mockReturnValue(new Promise(() => undefined));
	},
};
export const LoadError: Story = {
	beforeEach: () => {
		mocked(getAdminPaymentConfig).mockRejectedValue(new Error("Network error"));
	},
};
