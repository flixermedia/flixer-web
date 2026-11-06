import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { mocked } from "storybook/test";
import { listAdminOrders, refundOrder } from "../../../api";
import { adminOrdersFixture } from "../../../storybook/fixturesPaymentsAdmin";
import { restorePaymentHelpers } from "../../../storybook/fixturesPayments";
import PaymentOrdersPanel from "./PaymentOrdersPanel.vue";

const meta = {
	title: "Admin/Payments/PaymentOrdersPanel",
	component: PaymentOrdersPanel,
	tags: ["autodocs"],
	parameters: { layout: "padded" },
	beforeEach: () => {
		restorePaymentHelpers();
		mocked(listAdminOrders).mockResolvedValue({ total: adminOrdersFixture.length, items: adminOrdersFixture });
		mocked(refundOrder).mockResolvedValue(adminOrdersFixture[0]);
	},
} satisfies Meta<typeof PaymentOrdersPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Paginated: Story = {
	beforeEach: () => {
		mocked(listAdminOrders).mockResolvedValue({ total: 80, items: adminOrdersFixture });
	},
};
export const Empty: Story = {
	beforeEach: () => {
		mocked(listAdminOrders).mockResolvedValue({ total: 0, items: [] });
	},
};
export const Loading: Story = {
	beforeEach: () => {
		mocked(listAdminOrders).mockReturnValue(new Promise(() => undefined));
	},
};
export const LoadError: Story = {
	beforeEach: () => {
		mocked(listAdminOrders).mockRejectedValue(new Error("Network error"));
	},
};
