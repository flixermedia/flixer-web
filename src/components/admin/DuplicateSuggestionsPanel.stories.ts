import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, mocked, userEvent, within } from "storybook/test";
import { listMediaLibraries } from "../../api";
import { listDuplicateSuggestions, type DuplicateSuggestionsPage } from "../../api/duplicateSuggestions";
import DuplicateSuggestionsPanel from "./DuplicateSuggestionsPanel.vue";

const emptyPage: DuplicateSuggestionsPage = { items: [], total: 0, page: 1, size: 25 };

const meta = {
	title: "Admin/DuplicateSuggestionsPanel",
	component: DuplicateSuggestionsPanel,
	tags: ["autodocs"],
	parameters: { layout: "padded" },
	beforeEach: () => {
		mocked(listDuplicateSuggestions).mockResolvedValue(emptyPage);
		mocked(listMediaLibraries).mockResolvedValue([]);
	},
} satisfies Meta<typeof DuplicateSuggestionsPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const RefreshSuggestions: Story = {
	play: async ({ canvasElement }) => {
		const page = within(canvasElement.ownerDocument.body);
		await page.findByText(/no exact provider identity suggestions/i);
		await userEvent.click(page.getByRole("button", { name: /refresh/i }));
		await expect(mocked(listDuplicateSuggestions)).toHaveBeenCalledTimes(2);
	},
};
