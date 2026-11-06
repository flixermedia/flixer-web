import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { mocked } from "storybook/test";
import { checkoutPayment, getOffers } from "../../api";
import { installFakeStripe, mockPaymentData, offers, setPaymentStatus } from "../../storybook/paymentsMocks";
import { modalStory } from "../../storybook/modalStory";
import OffersModal from "./OffersModal.vue";

const meta = {
	title: "Payments/OffersModal",
	component: OffersModal,
	tags: ["autodocs"],
	parameters: { layout: "fullscreen" },
	args: { itemId: "item-1", title: "Dune: Part Two" },
	beforeEach: async () => {
		mockPaymentData();
		mocked(checkoutPayment).mockResolvedValue({ status: "paid", orderId: "ord_new" });
		await setPaymentStatus();
		return installFakeStripe();
	},
	render: (args) => modalStory(OffersModal, args)(),
} satisfies Meta<typeof OffersModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const NoOffers: Story = {
	beforeEach: () => {
		mocked(getOffers).mockResolvedValue({ ...offers, products: [], plans: [] });
	},
};
export const LoadFails: Story = {
	beforeEach: () => {
		mocked(getOffers).mockRejectedValue(new Error("Network error"));
	},
};
