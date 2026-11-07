import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, mocked, userEvent, waitFor, within } from "storybook/test";
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
export const AdFreePlan: Story = {
	args: { plan: plansFixture[0] },
	play: async () => {
		const page = within(document.body);
		const toggle = await page.findByRole("switch", { name: /Ad-free/ });
		await userEvent.click(toggle);
		const form = toggle.closest("form")!;
		expect([...form.querySelectorAll("input")].filter((input) => !input.checkValidity()).map((input) => [input.type, input.value, input.validationMessage])).toEqual([]);
		const button = page.getByRole("button", { name: "Save Changes" }) as HTMLButtonElement;
		expect(button.form).toBe(form);
		await userEvent.click(button);
		await waitFor(() => expect(savePlan).toHaveBeenCalledWith(plansFixture[0].id, expect.objectContaining({ adsExempt: true })));
	},
};
