import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { mocked } from "storybook/test";
import { createGrant, listAdminUsers, listGrants, revokeGrant, searchPaymentScopes } from "../../../api";
import { adminUsers } from "../../../storybook/fixturesAdminAB";
import { grantsFixture } from "../../../storybook/fixturesPaymentsAdmin";
import { restorePaymentHelpers } from "../../../storybook/fixturesPayments";
import PaymentGrantsPanel from "./PaymentGrantsPanel.vue";

const meta = {
	title: "Admin/Payments/PaymentGrantsPanel",
	component: PaymentGrantsPanel,
	tags: ["autodocs"],
	parameters: { layout: "padded" },
	beforeEach: () => {
		restorePaymentHelpers();
		mocked(listAdminUsers).mockResolvedValue(adminUsers);
		mocked(listGrants).mockResolvedValue(grantsFixture);
		mocked(createGrant).mockResolvedValue(grantsFixture[0]);
		mocked(revokeGrant).mockResolvedValue(undefined);
		mocked(searchPaymentScopes).mockResolvedValue({ items: [], artists: [] });
	},
} satisfies Meta<typeof PaymentGrantsPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const NoGrants: Story = {
	beforeEach: () => {
		mocked(listGrants).mockResolvedValue([]);
	},
};
export const NoUsers: Story = {
	beforeEach: () => {
		mocked(listAdminUsers).mockResolvedValue([]);
	},
};
