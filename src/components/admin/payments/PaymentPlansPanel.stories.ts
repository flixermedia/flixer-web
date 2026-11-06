import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { mocked } from "storybook/test";
import { deletePlan, listPlans, searchPaymentScopes } from "../../../api";
import { plansFixture, restorePaymentHelpers } from "../../../storybook/fixturesPayments";
import PaymentPlansPanel from "./PaymentPlansPanel.vue";

const meta = {
	title: "Admin/Payments/PaymentPlansPanel",
	component: PaymentPlansPanel,
	tags: ["autodocs"],
	parameters: { layout: "padded" },
	args: { currency: "USD", currencies: ["USD", "EUR"] },
	beforeEach: () => {
		restorePaymentHelpers();
		mocked(listPlans).mockResolvedValue(plansFixture);
		mocked(deletePlan).mockResolvedValue(undefined);
		mocked(searchPaymentScopes).mockResolvedValue({ items: [], artists: [] });
	},
} satisfies Meta<typeof PaymentPlansPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Empty: Story = {
	beforeEach: () => {
		mocked(listPlans).mockResolvedValue([]);
	},
};
export const Loading: Story = {
	beforeEach: () => {
		mocked(listPlans).mockReturnValue(new Promise(() => undefined));
	},
};
export const LoadError: Story = {
	beforeEach: () => {
		mocked(listPlans).mockRejectedValue(new Error("Network error"));
	},
};
