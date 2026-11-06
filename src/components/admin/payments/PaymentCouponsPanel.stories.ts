import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { mocked } from "storybook/test";
import { deleteCoupon, listCoupons, listPlans, listProducts } from "../../../api";
import { couponsFixture } from "../../../storybook/fixturesPaymentsAdmin";
import { plansFixture, productsFixture, restorePaymentHelpers } from "../../../storybook/fixturesPayments";
import PaymentCouponsPanel from "./PaymentCouponsPanel.vue";

const meta = {
	title: "Admin/Payments/PaymentCouponsPanel",
	component: PaymentCouponsPanel,
	tags: ["autodocs"],
	parameters: { layout: "padded" },
	args: { currency: "USD", currencies: ["USD", "EUR"] },
	beforeEach: () => {
		restorePaymentHelpers();
		mocked(listCoupons).mockResolvedValue(couponsFixture);
		mocked(listProducts).mockResolvedValue(productsFixture);
		mocked(listPlans).mockResolvedValue(plansFixture);
		mocked(deleteCoupon).mockResolvedValue(undefined);
	},
} satisfies Meta<typeof PaymentCouponsPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Empty: Story = {
	beforeEach: () => {
		mocked(listCoupons).mockResolvedValue([]);
	},
};
export const Loading: Story = {
	beforeEach: () => {
		mocked(listCoupons).mockReturnValue(new Promise(() => undefined));
	},
};
export const LoadError: Story = {
	beforeEach: () => {
		mocked(listCoupons).mockRejectedValue(new Error("Network error"));
	},
};
