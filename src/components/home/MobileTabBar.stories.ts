import type { Meta, StoryObj } from "@storybook/vue3-vite";
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
