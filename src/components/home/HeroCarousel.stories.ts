import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { createAgent } from "@ui-sdk/vue/agent";
import { expect, mocked, userEvent } from "storybook/test";
import { fetchHomeImage, fetchMediaImage } from "../../api";
import { artworkBlob } from "../../storybook/fixturesAccount";
import { withNamedRoutes } from "../../storybook/routeDecorator";
import { featuredFixtures } from "../../storybook/fixturesPlayer";
import HeroCarousel from "./HeroCarousel.vue";

const meta = {
	title: "Home/HeroCarousel",
	component: HeroCarousel,
	tags: ["autodocs"],
	parameters: { layout: "fullscreen" },
	args: { items: featuredFixtures },
	decorators: [withNamedRoutes({ "media-item": "/media/:id" })],
	beforeEach: () => {
		mocked(fetchMediaImage).mockImplementation(async () => artworkBlob("#0e7490"));
		mocked(fetchHomeImage).mockImplementation(async () => artworkBlob("#0e7490"));
	},
} satisfies Meta<typeof HeroCarousel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const SingleItem: Story = { args: { items: featuredFixtures.slice(0, 1) } };
export const LongTitleWithoutBackdrop: Story = { args: { items: featuredFixtures.slice(2) } };
export const Empty: Story = { args: { items: [] } };
export const SlideControls: Story = {
	play: async ({ canvas }) => {
		const first = canvas.getByRole("button", { name: "Show Blade Runner 2049" });
		const second = canvas.getByRole("button", { name: "Show Severance" });
		await expect(first).toHaveAttribute("aria-current", "true");
		await expect(first.getBoundingClientRect().width).toBe(24);
		await expect(second.getBoundingClientRect().width).toBe(10);
		second.focus();
		await userEvent.keyboard(" ");
		await expect(second).toHaveAttribute("aria-current", "true");
		await expect(canvas.getByRole("heading", { name: "Severance" })).toBeVisible();
		const agent = createAgent();
		await expect(agent.snapshot()).toEqual(expect.arrayContaining([
			expect.objectContaining({ component: "button", label: "Show Blade Runner 2049" }),
			expect.objectContaining({ component: "button", label: "Show Severance" }),
		]));
		const result = await agent.act({ steps: [{ ref: "Show Blade Runner 2049", action: "press" }] });
		await expect(result.ok, result.error?.message).toBe(true);
		await expect(first).toHaveAttribute("aria-current", "true");
	},
};
export const TvSlideControls: Story = {
	args: { tv: true },
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("button", { name: "Show Severance" })).toHaveAttribute("tabindex", "-1");
	},
};
