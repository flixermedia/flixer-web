import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { fn, mocked } from "storybook/test";
import { getPaymentStatus, type PaymentStatus } from "../../api";
import RegistrationForm from "./RegistrationForm.vue";

const paidStatus = {
	enabled: true,
	provider: "stripe",
	client: null,
	currency: "usd",
	currencies: ["usd"],
	tax: { enabled: false },
	registration: { cardRequired: true, feeEnabled: true, mode: "paid", prices: [], price: null, unlocks: {}, plan: null },
} as unknown as PaymentStatus;

const meta = {
	title: "Auth/RegistrationForm",
	component: RegistrationForm,
	tags: ["autodocs"],
	args: { isSubmitting: false, registrationEnabled: true, registrationStatusError: "", onSubmit: fn(), onSwitchMode: fn() },
	beforeEach: () => {
		mocked(getPaymentStatus).mockResolvedValue({ enabled: false });
	},
} satisfies Meta<typeof RegistrationForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Submitting: Story = { args: { isSubmitting: true } };
export const PaymentFollows: Story = {
	beforeEach: () => {
		mocked(getPaymentStatus).mockResolvedValue(paidStatus);
	},
};
