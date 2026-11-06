import type { Meta, StoryObj } from "@storybook/vue3-vite";
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
