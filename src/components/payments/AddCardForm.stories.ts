import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { fn, mocked } from "storybook/test";
import { addPaymentMethod, beginMethodSetup } from "../../api";
import { installFakeStripe, savedCards } from "../../storybook/paymentsMocks";
import AddCardForm from "./AddCardForm.vue";

const meta = {
	title: "Payments/AddCardForm",
	component: AddCardForm,
	tags: ["autodocs"],
	parameters: { layout: "padded" },
	decorators: [() => ({ template: '<div class="w-96"><story /></div>' })],
	args: { cancellable: true, onAdded: fn(), onCancel: fn() },
	beforeEach: () => {
		mocked(beginMethodSetup).mockResolvedValue({ provider: "stripe", clientSecret: "seti_secret_storybook", client: { publishableKey: "pk_test_storybook" } });
		mocked(addPaymentMethod).mockResolvedValue(savedCards[0]);
		return installFakeStripe();
	},
} satisfies Meta<typeof AddCardForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const NotCancellable: Story = { args: { cancellable: false } };
export const SetupFails: Story = {
	beforeEach: () => {
		mocked(beginMethodSetup).mockRejectedValue(new Error("Setup failed"));
	},
};
