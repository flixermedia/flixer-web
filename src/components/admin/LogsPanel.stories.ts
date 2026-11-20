import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, userEvent, within } from "storybook/test";
import LogsPanel from "./LogsPanel.vue";

const meta = {
	title: "Admin/LogsPanel",
	component: LogsPanel,
	tags: ["autodocs"],
	parameters: { layout: "padded" },
} satisfies Meta<typeof LogsPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const LoggingShortcut: Story = {};
export const FilterByLevelWithKeyboard: Story = {
	play: async ({ canvasElement }) => {
		const page = within(canvasElement.ownerDocument.body);
		const level = page.getByRole("combobox", { name: /log level/i });
		await userEvent.click(level);
		await userEvent.click(await page.findByRole("option", { name: /warn/i }));
		await expect(level).toHaveTextContent(/warn/i);
	},
};
