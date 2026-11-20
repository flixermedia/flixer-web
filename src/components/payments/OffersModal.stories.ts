import { closeModalsByGroup } from "@kolirt/vue-modal";
import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { createAgent } from "@ui-sdk/vue/agent";
import { expect, mocked, userEvent, waitFor, within } from "storybook/test";
import { checkoutPayment, confirmPaymentOrder, getOffers, quotePayment, type CheckoutResult } from "../../api";
import { modalStory } from "../../storybook/modalStory";
import { installFakeStripe, mockPaymentData, offers, quote, setPaymentStatus } from "../../storybook/paymentsMocks";
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
		mocked(confirmPaymentOrder).mockRejectedValue(new Error("Unexpected payment confirmation in this story"));
		await setPaymentStatus();
		const restoreStripe = installFakeStripe();
		return async () => {
			await closeModalsByGroup("default", { instantExit: true });
			restoreStripe();
		};
	},
	render: (args) => modalStory(OffersModal, args)(),
} satisfies Meta<typeof OffersModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	play: async () => {
		const page = within(document.body);
		const group = within(await page.findByRole("radiogroup", { name: "Choose an option" }));
		const buy = group.getByRole("radio", { name: /^Buy/ });
		const rent = group.getByRole("radio", { name: /^Rent/ });
		const apply = page.getByRole("button", { name: "Apply" });
		await expect(buy).toBeChecked();
		await expect(buy).toHaveAttribute("tabindex", "0");
		await expect(rent).toHaveAttribute("tabindex", "-1");
		await userEvent.click(buy);
		await userEvent.keyboard("{ArrowDown}");
		await expect(rent).toHaveFocus();
		await expect(rent).toBeChecked();
		await expect(quotePayment).toHaveBeenLastCalledWith({ productId: "prod_rent", couponCode: undefined });
		await userEvent.keyboard("{ArrowUp}");
		await expect(buy).toHaveFocus();
		await expect(buy).toBeChecked();
		await expect(apply).toBeDisabled();

		mocked(quotePayment).mockRejectedValueOnce(new Error("Coupon expired"));
		const coupon = page.getByRole("textbox", { name: "Coupon code" });
		await userEvent.type(coupon, "EXPIRED{Enter}");
		await expect(await page.findByRole("alert")).toHaveTextContent("Coupon expired");
		await expect(quotePayment).toHaveBeenCalledWith({ productId: "prod_buy", couponCode: "EXPIRED" });
		await expect(quotePayment).toHaveBeenLastCalledWith({ productId: "prod_buy" });
		await expect(coupon).toHaveValue("");
		await expect(await page.findByRole("button", { name: "Pay $14.99" })).toBeEnabled();
		await userEvent.click(page.getByRole("button", { name: "Close" }));
		await waitFor(() => expect(page.queryByRole("heading", { name: "Unlock this title" })).not.toBeInTheDocument());
		await expect(checkoutPayment).not.toHaveBeenCalled();
	},
};

export const CheckoutRetry: Story = {
	play: async () => {
		const page = within(document.body);
		const pay = await page.findByRole("button", { name: "Pay $14.99" });
		const close = page.getByRole("button", { name: "Close" });
		const agent = createAgent();
		await expect(agent.snapshot()).toEqual([]);
		const denied = await agent.act({ steps: [{ ref: "Pay $14.99", action: "press" }] });
		await expect(denied.ok).toBe(false);
		await expect(checkoutPayment).not.toHaveBeenCalled();

		let resolveCheckout!: (result: CheckoutResult) => void;
		mocked(checkoutPayment).mockReturnValueOnce(new Promise((resolve) => { resolveCheckout = resolve; }));
		await userEvent.dblClick(pay);
		const pending = await page.findByRole("button", { name: "Processing…" });
		await expect(pending).toBeDisabled();
		await expect(pending).toHaveAttribute("aria-busy", "true");
		await expect(close).toBeDisabled();
		await userEvent.click(pending);
		await expect(checkoutPayment).toHaveBeenCalledTimes(1);
		await expect(checkoutPayment).toHaveBeenCalledWith({ productId: "prod_buy", currency: quote.currency, couponCode: undefined, paymentMethodId: "pm_1" });

		resolveCheckout({ status: "failed", orderId: "ord_new", error: "Card declined" });
		await expect(await page.findByRole("alert")).toHaveTextContent("Card declined");
		const retry = await page.findByRole("button", { name: "Pay $14.99" });
		await expect(retry).toBeEnabled();
		await expect(close).toBeEnabled();
		retry.focus();
		await userEvent.keyboard("{Enter}");
		await waitFor(() => expect(page.queryByRole("heading", { name: "Unlock this title" })).not.toBeInTheDocument());
		await expect(checkoutPayment).toHaveBeenCalledTimes(2);
		await expect(confirmPaymentOrder).not.toHaveBeenCalled();
	},
};
export const ProviderAuthentication: Story = {
	beforeEach: () => {
		mocked(checkoutPayment).mockResolvedValue({
			status: "requires_action",
			orderId: "ord_auth",
			clientSecret: "storybook-client-secret",
		});
		mocked(confirmPaymentOrder).mockResolvedValue({ status: "paid", orderId: "ord_auth" });
	},
	play: async () => {
		const page = within(document.body);
		await userEvent.click(await page.findByRole("button", { name: "Pay $14.99" }));
		await waitFor(() => expect(confirmPaymentOrder).toHaveBeenCalledWith("ord_auth"));
		await expect(confirmPaymentOrder).toHaveBeenCalledTimes(1);
		await waitFor(() => expect(page.queryByRole("heading", { name: "Unlock this title" })).not.toBeInTheDocument());
	},
};
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
