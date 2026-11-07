import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, mocked, userEvent, waitFor, within } from "storybook/test";
import { saveProduct, searchPaymentScopes } from "../../../api";
import { modalStory } from "../../../storybook/modalStory";
import { productsFixture, restorePaymentHelpers } from "../../../storybook/fixturesPayments";
import ProductEditModal from "./ProductEditModal.vue";

const meta = {
	title: "Admin/Payments/ProductEditModal",
	component: ProductEditModal,
	tags: ["autodocs"],
	parameters: { layout: "fullscreen" },
	args: { product: null, currency: "USD", currencies: ["USD", "EUR"], sortOrder: 2 },
	beforeEach: () => {
		restorePaymentHelpers();
		mocked(searchPaymentScopes).mockResolvedValue({ items: [], artists: [] });
		mocked(saveProduct).mockResolvedValue(productsFixture[0]);
	},
	render: (args) => modalStory(ProductEditModal, args)(),
} satisfies Meta<typeof ProductEditModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NewProduct: Story = {};
export const EditRental: Story = { args: { product: productsFixture[0] } };
export const EditPurchase: Story = { args: { product: productsFixture[1] } };
export const AdFreeRental: Story = {
	args: { product: productsFixture[0] },
	play: async () => {
		const page = within(document.body);
		const toggle = await page.findByRole("switch", { name: /Ad-free/ });
		await userEvent.click(toggle);
		const form = toggle.closest("form")!;
		expect([...form.querySelectorAll("input")].filter((input) => !input.checkValidity()).map((input) => [input.type, input.value, input.validationMessage])).toEqual([]);
		const button = page.getByRole("button", { name: "Save Changes" }) as HTMLButtonElement;
		expect(button.form).toBe(form);
		await userEvent.click(button);
		await waitFor(() => expect(saveProduct).toHaveBeenCalledWith(productsFixture[0].id, expect.objectContaining({ adsExempt: true })));
	},
};
