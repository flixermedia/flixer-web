import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { mocked } from "storybook/test";
import { getAdminPaymentConfig, listCoupons, listPaymentCurrencies, listPlans, listProducts } from "../../../api";
import { couponsFixture, currenciesFixture, paymentConfigFixture } from "../../../storybook/fixturesPaymentsAdmin";
import { plansFixture, productsFixture, restorePaymentHelpers } from "../../../storybook/fixturesPayments";
import PaymentCatalogPanel from "./PaymentCatalogPanel.vue";

const meta = {
	title: "Admin/Payments/PaymentCatalogPanel",
	component: PaymentCatalogPanel,
	tags: ["autodocs"],
	parameters: { layout: "padded" },
	beforeEach: () => {
		restorePaymentHelpers();
		mocked(getAdminPaymentConfig).mockResolvedValue(paymentConfigFixture);
		mocked(listPaymentCurrencies).mockResolvedValue(currenciesFixture);
		mocked(listProducts).mockResolvedValue(productsFixture);
		mocked(listPlans).mockResolvedValue(plansFixture);
		mocked(listCoupons).mockResolvedValue(couponsFixture);
	},
} satisfies Meta<typeof PaymentCatalogPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const EmptyCatalog: Story = {
	beforeEach: () => {
		mocked(listProducts).mockResolvedValue([]);
		mocked(listPlans).mockResolvedValue([]);
		mocked(listCoupons).mockResolvedValue([]);
	},
};
export const ConfigUnavailable: Story = {
	beforeEach: () => {
		mocked(getAdminPaymentConfig).mockRejectedValue(new Error("Network error"));
	},
};
