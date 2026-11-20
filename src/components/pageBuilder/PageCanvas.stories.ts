import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { createAgent } from "@ui-sdk/vue/agent";
import { expect, userEvent } from "storybook/test";
import { ref } from "vue";
import PageCanvas from "./PageCanvas.vue";
import type { PageBlock } from "./pageBuilder";

const meta = {
	title: "Page Builder/Canvas",
	render: () => ({
		components: { PageCanvas },
		setup() {
			const blocks = ref<PageBlock[]>([
				{ id: "text", type: "text", text: "First line", image: null },
				{ id: "link", type: "button", text: "Sample link", image: null, href: "#sample" },
			]);
			const selected = ref("text");
			function updateText(id: string, value: string) {
				const block = blocks.value.find((entry) => entry.id === id);
				if (block) block.text = value;
			}
			return { blocks, selected, updateText };
		},
		template: `<PageCanvas :blocks="blocks" editable :selected-id="selected" @text="updateText" @select="selected = $event" />`,
	}),
} satisfies Meta;
export default meta;

export const InlineEditing: StoryObj<typeof meta> = {
	play: async ({ canvas }) => {
		const textbox = canvas.getByRole("textbox", { name: "text" });
		await userEvent.click(textbox);
		await userEvent.keyboard("{End}{Enter}Second line");
		await expect(textbox).toHaveValue("First line\nSecond line");
		const labels = createAgent().snapshot().filter((entry) => !entry.offPage).map((entry) => entry.label);
		await expect(labels).not.toContain("text");
		const link = canvas.getByRole("link", { name: "Sample link" });
		await expect(link).toHaveAttribute("href", "#sample");
		await userEvent.click(link);
		await expect(canvas.getByText(/First line\s+Second line/)).toBeVisible();
		await expect(window.location.hash).not.toBe("#sample");
	},
};
