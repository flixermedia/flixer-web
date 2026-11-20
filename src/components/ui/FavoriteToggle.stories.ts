import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { createAgent } from "@ui-sdk/vue/agent";
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
		const button = canvas.getByRole("button", { name: "Add To Favourites" });
		await expect(button).toHaveAttribute("aria-pressed", "false");
		const agent = createAgent();
		await expect(agent.snapshot()).toEqual(expect.arrayContaining([
			expect.objectContaining({ component: "button", label: "Add To Favourites" }),
		]));
		button.focus();
		await userEvent.keyboard(" ");
		await waitFor(() => expect(addFavorite).toHaveBeenCalledWith("item-1"));
		await expect(button).toHaveAttribute("aria-pressed", "true");
		const result = await agent.act({ steps: [{ ref: "Remove From Favourites", action: "press" }] });
		await expect(result.ok, result.error?.message).toBe(true);
		await waitFor(() => expect(removeFavorite).toHaveBeenCalledWith("item-1"));
		await expect(button).toHaveAttribute("aria-pressed", "false");
	},
};
export const Compact: Story = { args: { compact: true } };
export const Favourited: Story = {
	beforeEach: () => {
		mocked(getFavoriteIds).mockResolvedValue({ ids: ["item-1"] });
	},
};
