import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { mocked } from "storybook/test";
import { listAdminSubscriptions } from "../../../api";
import { adminSubscriptionsFixture } from "../../../storybook/fixturesPayments";
import PaymentSubscriptionsPanel from "./PaymentSubscriptionsPanel.vue";

const meta = {
	title: "Admin/Payments/PaymentSubscriptionsPanel",
	component: PaymentSubscriptionsPanel,
	tags: ["autodocs"],
	parameters: { layout: "padded" },
} satisfies Meta<typeof PaymentSubscriptionsPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	beforeEach: () => {
		mocked(listAdminSubscriptions).mockResolvedValue(adminSubscriptionsFixture);
	},
};

export const Empty: Story = {
	beforeEach: () => {
		mocked(listAdminSubscriptions).mockResolvedValue([]);
	},
};
