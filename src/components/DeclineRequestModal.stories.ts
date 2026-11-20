import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { closeModalsByGroup, ModalClosedError, openModal } from "@kolirt/vue-modal";
import { createAgent } from "@ui-sdk/vue/agent";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { ref } from "vue";
import { modalStory } from "../storybook/modalStory";
import DeclineRequestModal from "./DeclineRequestModal.vue";

const meta = {
	title: "Requests/DeclineRequestModal",
	component: DeclineRequestModal,
	tags: ["autodocs"],
	parameters: { layout: "fullscreen" },
	beforeEach: () => async () => { await closeModalsByGroup("default", { instantExit: true }); },
	args: { title: "Dune: Part Two" },
	render: (args) => modalStory(DeclineRequestModal, args)(),
} satisfies Meta<typeof DeclineRequestModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Results: Story = {
	render: () => ({
		setup() {
			const result = ref("waiting");
			const open = async () => {
				result.value = "waiting";
				try {
					result.value = await openModal<string>(DeclineRequestModal, { props: { title: "Dune: Part Two" } });
				} catch (error) {
					if (!(error instanceof ModalClosedError)) throw error;
					result.value = "cancelled";
				}
			};
			return { open, result };
		},
		template: '<button type="button" @click="open">Open decline</button><output data-testid="result">{{ result }}</output>',
	}),
	play: async ({ canvas }) => {
		const page = within(document.body);
		const trigger = canvas.getByRole("button", { name: "Open decline" });
		await userEvent.click(trigger);
		const reason = await page.findByRole("textbox", { name: "Optional reason for declining" });
		await expect(reason).toHaveAttribute("maxlength", "500");
		const agent = createAgent();
		const result = await agent.act({ steps: [{ ref: "Optional reason for declining", action: "setValue", args: ["  Not available  "] }] });
		await expect(result.ok, result.error?.message).toBe(true);
		await expect(reason).toHaveValue("  Not available  ");
		const denied = await agent.act({ steps: [{ ref: "Decline", action: "press" }] });
		await expect(denied.ok).toBe(false);
		await expect(denied.error?.message).toContain("Needs a person");
		await expect(canvas.getByTestId("result")).toHaveTextContent("waiting");
		await userEvent.click(page.getByRole("button", { name: "Decline" }));
		await waitFor(() => expect(canvas.getByTestId("result")).toHaveTextContent("Not available"));
		await userEvent.click(trigger);
		await userEvent.click(await page.findByRole("button", { name: "Cancel" }));
		await waitFor(() => expect(canvas.getByTestId("result")).toHaveTextContent("cancelled"));
		await waitFor(() => expect(trigger).toHaveFocus());
	},
};
