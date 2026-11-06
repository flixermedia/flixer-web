import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { mocked } from "storybook/test";
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
