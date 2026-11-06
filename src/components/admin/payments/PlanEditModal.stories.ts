import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { mocked } from "storybook/test";
import { savePlan, searchPaymentScopes } from "../../../api";
import { modalStory } from "../../../storybook/modalStory";
import { plansFixture, restorePaymentHelpers } from "../../../storybook/fixturesPayments";
import PlanEditModal from "./PlanEditModal.vue";

const meta = {
	title: "Admin/Payments/PlanEditModal",
	component: PlanEditModal,
	tags: ["autodocs"],
	parameters: { layout: "fullscreen" },
	args: { plan: null, currency: "USD", currencies: ["USD", "EUR"], sortOrder: 2 },
	beforeEach: () => {
		restorePaymentHelpers();
		mocked(searchPaymentScopes).mockResolvedValue({ items: [], artists: [] });
		mocked(savePlan).mockResolvedValue(plansFixture[0]);
	},
	render: (args) => modalStory(PlanEditModal, args)(),
} satisfies Meta<typeof PlanEditModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NewPlan: Story = {};
export const EditPlan: Story = { args: { plan: plansFixture[0] } };
