import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { closeModalsByGroup, ModalClosedError, openModal } from "@kolirt/vue-modal";
import { createAgent } from "@ui-sdk/vue/agent";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { ref } from "vue";
import { modalStory } from "../../storybook/modalStory";
import PartyVisibilityModal from "./PartyVisibilityModal.vue";

const meta = {
	title: "Party/PartyVisibilityModal",
	component: PartyVisibilityModal,
	tags: ["autodocs"],
	parameters: { layout: "fullscreen" },
	beforeEach: () => async () => { await closeModalsByGroup("default", { instantExit: true }); },
	render: () => modalStory(PartyVisibilityModal)(),
} satisfies Meta<typeof PartyVisibilityModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const SelectionAndCancel: Story = {
	render: () => ({
		setup() {
			const result = ref("waiting");
			const open = async () => {
				result.value = "waiting";
				try {
					result.value = await openModal<string>(PartyVisibilityModal);
				} catch (error) {
					if (!(error instanceof ModalClosedError)) throw error;
					result.value = "cancelled";
				}
			};
			return { open, result };
		},
		template: '<button @click="open">Open visibility</button><output data-testid="result">{{ result }}</output>',
	}),
	play: async ({ canvas }) => {
		const page = within(document.body);
		const trigger = canvas.getByRole("button", { name: "Open visibility" });
		await userEvent.click(trigger);
		let dialog = within(await page.findByRole("dialog", { name: "Who can join?" }));
		const agent = createAgent();
		const denied = await agent.act({ steps: [{ ref: "Friends only", action: "press" }] });
		expect(denied.ok).toBe(false);
		expect(canvas.getByTestId("result")).toHaveTextContent("waiting");
		const friends = dialog.getByRole("button", { name: /Friends only/ });
		friends.focus();
		await userEvent.keyboard("{Enter}");
		await waitFor(() => expect(canvas.getByTestId("result")).toHaveTextContent("friends"));
		await userEvent.click(trigger);
		dialog = within(await page.findByRole("dialog", { name: "Who can join?" }));
		await userEvent.click(dialog.getByRole("button", { name: "Cancel" }));
		await waitFor(() => expect(canvas.getByTestId("result")).toHaveTextContent("cancelled"));
		await waitFor(() => expect(trigger).toHaveFocus());
	},
};
