import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { mocked } from "storybook/test";
import { deleteProduct, listProducts, searchPaymentScopes } from "../../../api";
import { productsFixture, restorePaymentHelpers } from "../../../storybook/fixturesPayments";
import PaymentProductsPanel from "./PaymentProductsPanel.vue";

const meta = {
	title: "Admin/Payments/PaymentProductsPanel",
	component: PaymentProductsPanel,
	tags: ["autodocs"],
	parameters: { layout: "padded" },
	args: { currency: "USD", currencies: ["USD", "EUR"] },
	beforeEach: () => {
		restorePaymentHelpers();
		mocked(listProducts).mockResolvedValue(productsFixture);
		mocked(deleteProduct).mockResolvedValue(undefined);
		mocked(searchPaymentScopes).mockResolvedValue({ items: [], artists: [] });
	},
} satisfies Meta<typeof PaymentProductsPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Empty: Story = {
	beforeEach: () => {
		mocked(listProducts).mockResolvedValue([]);
	},
};
export const Loading: Story = {
	beforeEach: () => {
		mocked(listProducts).mockReturnValue(new Promise(() => undefined));
	},
};
export const LoadError: Story = {
	beforeEach: () => {
		mocked(listProducts).mockRejectedValue(new Error("Network error"));
	},
};
