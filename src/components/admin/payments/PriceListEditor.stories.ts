import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { ref } from "vue";
import { restorePaymentHelpers } from "../../../storybook/fixturesPayments";
import PriceListEditor from "./PriceListEditor.vue";

const meta = {
	title: "Admin/Payments/PriceListEditor",
	component: PriceListEditor,
	tags: ["autodocs"],
	args: { label: "Prices", defaultCurrency: "USD", currencies: ["USD", "EUR", "JPY"], modelValue: [] },
	beforeEach: restorePaymentHelpers,
	render: (args) => ({ components: { PriceListEditor }, setup: () => ({ args, prices: ref([{ currency: "USD", amountMinor: 899 }]) }), template: '<PriceListEditor v-bind="args" v-model="prices" class="w-80" />' }),
} satisfies Meta<typeof PriceListEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const MultipleCurrencies: Story = {
	render: (args) => ({
		components: { PriceListEditor },
		setup: () => ({
			args,
			prices: ref([
				{ currency: "USD", amountMinor: 899 },
				{ currency: "JPY", amountMinor: 1200 },
			]),
		}),
		template: '<PriceListEditor v-bind="args" v-model="prices" class="w-80" />',
	}),
};
