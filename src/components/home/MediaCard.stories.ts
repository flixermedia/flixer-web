import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { createAgent } from "@ui-sdk/vue/agent";
import { expect, fn, userEvent } from "storybook/test";
import MediaCard from "./MediaCard.vue";

const meta = {
	title: "Home/MediaCard",
	component: MediaCard,
	tags: ["autodocs"],
	args: { title: "Big Buck Bunny", subtitle: "2008", variant: "poster" },
	argTypes: { variant: { control: "inline-radio", options: ["poster", "landscape", "library", "square"] } },
	decorators: [() => ({ template: '<ul class="w-44"><story /></ul>' })],
} satisfies Meta<typeof MediaCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Poster: Story = {};
export const Landscape: Story = { args: { variant: "landscape" }, decorators: [() => ({ template: '<ul class="w-72"><story /></ul>' })] };
export const InProgress: Story = { args: { progress: 0.45 } };
export const WithBadge: Story = { args: { badge: { text: "New", tone: "info" } } };
export const CardActions: Story = {
	args: { markable: true, dismissible: true, dismissLabel: "Remove from list", onWatched: fn(), onDismiss: fn() },
	play: async ({ args, canvas }) => {
		const watched = canvas.getByRole("button", { name: "Mark as Watched" });
		const dismiss = canvas.getByRole("button", { name: "Remove from list" });
		await expect(createAgent().snapshot()).toEqual(expect.arrayContaining([
			expect.objectContaining({ component: "button", label: "Mark as Watched" }),
			expect.objectContaining({ component: "button", label: "Remove from list" }),
		]));

		watched.focus();
		await userEvent.keyboard("{Enter}");
		await expect(args.onWatched).toHaveBeenCalledTimes(1);
		await expect(args.onDismiss).not.toHaveBeenCalled();

		await userEvent.tab();
		await expect(dismiss).toHaveFocus();
		await userEvent.keyboard(" ");
		await expect(args.onDismiss).toHaveBeenCalledTimes(1);
		await expect(args.onWatched).toHaveBeenCalledTimes(1);
	},
};
