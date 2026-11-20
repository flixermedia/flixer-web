import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { closeModalsByGroup } from "@kolirt/vue-modal";
import { createAgent } from "@ui-sdk/vue/agent";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { ref } from "vue";
import { confirmAction } from "../../composables/confirm";
import { modalStory } from "../../storybook/modalStory";
import ConfirmModal from "./ConfirmModal.vue";

const meta = {
	title: "UI/ConfirmModal",
	component: ConfirmModal,
	tags: ["autodocs"],
	parameters: { layout: "fullscreen" },
	beforeEach: () => async () => { await closeModalsByGroup("default", { instantExit: true }); },
	args: { message: "This cannot be undone." },
	render: (args) => modalStory(ConfirmModal, args)(),
} satisfies Meta<typeof ConfirmModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Danger: Story = { args: { title: "Delete library?", confirmLabel: "Delete", danger: true } };
export const Results: Story = {
	render: () => ({
		setup() {
			const result = ref("waiting");
			const open = async () => {
				result.value = "waiting";
				result.value = String(await confirmAction("This cannot be undone.", { title: "Delete library?", confirmLabel: "Delete", danger: true }));
			};
			return { open, result };
		},
		template: '<button type="button" @click="open">Open confirmation</button><output data-testid="result">{{ result }}</output>',
	}),
	play: async ({ canvas }) => {
		const page = within(document.body);
		await userEvent.click(canvas.getByRole("button", { name: "Open confirmation" }));
		await userEvent.click(await page.findByRole("button", { name: "Cancel" }));
		await waitFor(() => expect(canvas.getByTestId("result")).toHaveTextContent("false"));
		await userEvent.click(await canvas.findByRole("button", { name: "Open confirmation" }));
		await page.findByRole("button", { name: "Delete" });
		const agent = createAgent();
		const denied = await agent.act({ steps: [{ ref: "Delete", action: "press" }] });
		await expect(denied.ok).toBe(false);
		await expect(denied.error?.message).toContain("Needs a person");
		await expect(canvas.getByTestId("result")).toHaveTextContent("waiting");
		await userEvent.click(await page.findByRole("button", { name: "Delete" }));
		await waitFor(() => expect(canvas.getByTestId("result")).toHaveTextContent("true"));
		await userEvent.click(await canvas.findByRole("button", { name: "Open confirmation" }));
		const cancel = await page.findByRole("button", { name: "Cancel" });
		await waitFor(() => expect(cancel).toHaveFocus());
		await userEvent.keyboard("{Escape}");
		await waitFor(() => expect(canvas.getByTestId("result")).toHaveTextContent("false"));
	},
};
