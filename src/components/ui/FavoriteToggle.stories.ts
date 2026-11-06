import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, mocked, userEvent, waitFor } from "storybook/test";
import { addFavorite, getFavoriteIds, removeFavorite } from "../../api";
import FavoriteToggle from "./FavoriteToggle.vue";

const meta = {
	title: "UI/FavoriteToggle",
	component: FavoriteToggle,
	tags: ["autodocs"],
	args: { itemId: "item-1", compact: false },
	beforeEach: () => {
		mocked(getFavoriteIds).mockResolvedValue({ ids: [] });
		mocked(addFavorite).mockResolvedValue(undefined as never);
		mocked(removeFavorite).mockResolvedValue(undefined as never);
	},
} satisfies Meta<typeof FavoriteToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	play: async ({ canvas }) => {
		const button = canvas.getByRole("button");
		await userEvent.click(button);
		await waitFor(() => expect(addFavorite).toHaveBeenCalled());
	},
};
export const Compact: Story = { args: { compact: true } };
export const Favourited: Story = {
	beforeEach: () => {
		mocked(getFavoriteIds).mockResolvedValue({ ids: ["item-1"] });
	},
};
