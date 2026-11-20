import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { closeModalsByGroup } from "@kolirt/vue-modal";
import { expect, userEvent, waitFor, within } from "storybook/test";
import ClampedText from "./ClampedText.vue";

const paragraph = "A long synopsis that keeps going so the clamp has something to cut off. ";

const meta = {
	title: "UI/ClampedText",
	component: ClampedText,
	tags: ["autodocs"],
	args: { title: "Synopsis", text: paragraph.repeat(12) },
	decorators: [() => ({ template: '<div class="w-96"><story /></div>' })],
} satisfies Meta<typeof ClampedText>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overflowing: Story = {
	beforeEach: () => async () => { await closeModalsByGroup("default", { instantExit: true }); },
	play: async ({ canvas }) => {
		const trigger = await canvas.findByRole("button", { name: /read more/i });
		trigger.focus();
		await userEvent.keyboard("{Enter}");
		const dialog = await within(document.body).findByRole("dialog", { name: "Synopsis" });
		await userEvent.click(within(dialog).getByRole("button", { name: "Close" }));
		await waitFor(() => expect(dialog).toHaveAttribute("data-state", "closed"));
	},
};
export const Short: Story = { args: { text: "Short enough to fit." } };
