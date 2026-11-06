import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { mocked } from "storybook/test";
import { cancelAdminSubscription, createGrant, getAdminUserPayments, refundOrder, removeUserCard, revokeGrant, searchPaymentScopes, waiveUserSignup } from "../../api";
import { adminUser } from "../../storybook/fixturesAdmin";
import { modalStory } from "../../storybook/modalStory";
import { myPayments, mockPaymentHelpers } from "../../storybook/paymentsMocks";
import UserPaymentsModal from "./UserPaymentsModal.vue";

const meta = {
	title: "Admin/UserPaymentsModal",
	component: UserPaymentsModal,
	tags: ["autodocs"],
	parameters: { layout: "fullscreen" },
	args: { user: adminUser },
	render: (args) => modalStory(UserPaymentsModal, args)(),
	beforeEach: () => {
		mockPaymentHelpers();
		mocked(getAdminUserPayments).mockResolvedValue({ ...myPayments, level: "partial", signupPending: false, role: "user" });
		mocked(searchPaymentScopes).mockResolvedValue({ items: [], artists: [] });
		mocked(cancelAdminSubscription).mockResolvedValue(undefined);
		mocked(createGrant).mockResolvedValue(undefined as never);
		mocked(refundOrder).mockResolvedValue(undefined as never);
		mocked(removeUserCard).mockResolvedValue(undefined);
		mocked(revokeGrant).mockResolvedValue(undefined);
		mocked(waiveUserSignup).mockResolvedValue(undefined);
	},
} satisfies Meta<typeof UserPaymentsModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const SignupPending: Story = { beforeEach: () => void mocked(getAdminUserPayments).mockResolvedValue({ ...myPayments, level: "none", signupPending: true, role: "user", subscriptions: [], orders: [], entitlements: [], methods: [] }) };
export const Loading: Story = { beforeEach: () => void mocked(getAdminUserPayments).mockReturnValue(new Promise(() => undefined)) };
export const LoadError: Story = { beforeEach: () => void mocked(getAdminUserPayments).mockRejectedValue(new Error("Network error")) };
