import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { createAgent } from "@ui-sdk/vue/agent";
import { expect, spyOn, userEvent } from "storybook/test";
import MediaCard from "./MediaCard.vue";
import MediaRow from "./MediaRow.vue";

const meta = {
	title: "Home/MediaRow",
	component: MediaRow,
	tags: ["autodocs"],
	parameters: { layout: "fullscreen" },
	args: { title: "Continue watching" },
	render: (args) => ({
		components: { MediaRow, MediaCard },
		setup: () => ({ args }),
		template: '<MediaRow v-bind="args"><li v-for="n in 12" :key="n" class="w-40 shrink-0"><MediaCard :title="`Title ${n}`" subtitle="2024" /></li></MediaRow>',
	}),
} satisfies Meta<typeof MediaRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const ScrollControls: Story = {
	play: async ({ canvas, canvasElement }) => {
		const left = canvas.getByRole("button", { name: "Scroll Continue watching left" });
		const right = canvas.getByRole("button", { name: "Scroll Continue watching right" });
		await expect(right).toBeEnabled();
		const list = canvasElement.querySelector("ul")!;
		const scroll = spyOn(list, "scrollBy").mockImplementation(() => {});
		const agent = createAgent();
		await expect(agent.snapshot()).toEqual(expect.arrayContaining([
			expect.objectContaining({ component: "button", label: "Scroll Continue watching left" }),
			expect.objectContaining({ component: "button", label: "Scroll Continue watching right" }),
		]));
		left.focus();
		await userEvent.keyboard("{Enter}");
		await expect(scroll).toHaveBeenLastCalledWith({ left: -list.clientWidth * 0.85, behavior: "smooth" });
		const result = await agent.act({ steps: [{ ref: "Scroll Continue watching right", action: "press" }] });
		await expect(result.ok, result.error?.message).toBe(true);
		await expect(scroll).toHaveBeenLastCalledWith({ left: list.clientWidth * 0.85, behavior: "smooth" });
		scroll.mockRestore();
	},
};
