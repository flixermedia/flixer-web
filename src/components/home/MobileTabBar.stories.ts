import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { createAgent } from "@ui-sdk/vue/agent";
import { expect, userEvent } from "storybook/test";
import type { NavTab } from "../../types/media";
import MobileTabBar from "./MobileTabBar.vue";

const tabs: NavTab[] = [
	{ label: "Home", to: "/", icon: "lucide:house" },
	{ label: "Movies", to: "/movies", icon: "lucide:film" },
	{ label: "TV", to: "/tv", icon: "lucide:tv" },
	{ label: "Music", to: "/music", icon: "lucide:music-2" },
	{ label: "Chat", to: "/chat", icon: "lucide:messages-square" },
	{ label: "Guide", to: "/guide", icon: "lucide:calendar-days" },
	{ label: "Search", to: "/search", icon: "lucide:search" },
	{ label: "Discover", to: "/discover", icon: "lucide:sparkles" },
];

const meta = {
	title: "Home/MobileTabBar",
	component: MobileTabBar,
	tags: ["autodocs"],
	parameters: { layout: "fullscreen" },
	globals: { viewport: { value: "mobile1", isRotated: false } },
	args: { tabs },
	// The bar is fixed to the viewport; a transformed wrapper keeps it inside the story frame.
	decorators: [() => ({ template: '<div class="relative h-72 overflow-hidden" style="transform: translateZ(0)"><story /></div>' })],
} satisfies Meta<typeof MobileTabBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithoutDiscover: Story = { args: { tabs: tabs.filter((tab) => tab.to !== "/discover") } };
export const MoreInteraction: Story = {
	play: async ({ canvas }) => {
		const more = canvas.getByRole("button", { name: "More" });
		await expect(more).toHaveAttribute("aria-expanded", "false");
		more.focus();
		await userEvent.keyboard("{Enter}");
		await expect(more).toHaveAttribute("aria-expanded", "true");
		await expect(canvas.getByRole("link", { name: "Movies" })).toHaveAttribute("href", "/movies");
		await userEvent.keyboard("{Escape}");
		await expect(more).toHaveAttribute("aria-expanded", "false");
		const agent = createAgent();
		await expect(agent.snapshot()).toEqual(expect.arrayContaining([
			expect.objectContaining({ component: "button", label: "More" }),
		]));
		const result = await agent.act({ steps: [{ ref: "More", action: "press" }] });
		await expect(result.ok, result.error?.message).toBe(true);
		await expect(more).toHaveAttribute("aria-expanded", "true");
	},
};
