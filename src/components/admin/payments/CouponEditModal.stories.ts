import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { mocked } from "storybook/test";
import { saveCoupon } from "../../../api";
import { couponsFixture } from "../../../storybook/fixturesPaymentsAdmin";
import { plansFixture, productsFixture, restorePaymentHelpers } from "../../../storybook/fixturesPayments";
import { modalStory } from "../../../storybook/modalStory";
import CouponEditModal from "./CouponEditModal.vue";

const meta = {
	title: "Admin/Payments/CouponEditModal",
	component: CouponEditModal,
	tags: ["autodocs"],
	parameters: { layout: "fullscreen" },
	args: { coupon: null, currency: "USD", currencies: ["USD", "EUR"], products: productsFixture, plans: plansFixture },
	render: (args) => modalStory(CouponEditModal, args)(),
	beforeEach: () => {
		restorePaymentHelpers();
		mocked(saveCoupon).mockResolvedValue(couponsFixture[0]);
	},
} satisfies Meta<typeof CouponEditModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NewCoupon: Story = {};
export const EditPercentCoupon: Story = { args: { coupon: couponsFixture[0] } };
export const EditAmountCoupon: Story = { args: { coupon: couponsFixture[1] } };
