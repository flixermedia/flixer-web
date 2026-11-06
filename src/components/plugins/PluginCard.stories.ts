import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { withPluginContext } from "../../storybook/pluginContext";
import PluginCard from "./PluginCard.vue";

const src = "data:image/svg+xml;utf8," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="450"><rect width="100%" height="100%" fill="#334155"/></svg>');

const meta = {
	title: "Plugins/PluginCard",
	component: PluginCard,
	tags: ["autodocs"],
	decorators: [withPluginContext(), () => ({ template: '<div class="w-64"><story /></div>' })],
	args: {
		node: {
			type: "card",
			title: "Dune: Part Two",
			subtitle: "2024",
			image: { src, alt: "Dune", aspect: "poster" },
			badges: [
				{ text: "4K", tone: "info" },
				{ text: "Available", tone: "success" },
			],
			children: [{ type: "text", text: "Paul Atreides unites with the Fremen.", tone: "muted" }],
			actions: [{ type: "button", label: "Request", action: { op: "request" }, variant: "primary" }],
		},
	},
} satisfies Meta<typeof PluginCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Linked: Story = { args: { node: { type: "card", title: "Open details", subtitle: "Click the header", to: { query: { id: "42" }, merge: true } } } };
export const Minimal: Story = { args: { node: { type: "card", children: [{ type: "text", text: "A card with only body content." }] } } };
