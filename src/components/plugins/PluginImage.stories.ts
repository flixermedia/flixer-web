import type { Meta, StoryObj } from "@storybook/vue3-vite";
import PluginImage from "./PluginImage.vue";

const src = "data:image/svg+xml;utf8," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="450"><rect width="100%" height="100%" fill="#334155"/><text x="50%" y="50%" fill="#e2e8f0" font-size="28" text-anchor="middle">Poster</text></svg>');

const meta = {
	title: "Plugins/PluginImage",
	component: PluginImage,
	tags: ["autodocs"],
	decorators: [() => ({ template: '<div class="w-48"><story /></div>' })],
	args: { image: { src, alt: "Poster", aspect: "poster" } },
} satisfies Meta<typeof PluginImage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Poster: Story = {};
export const Square: Story = { args: { image: { src, alt: "Square", aspect: "square" } } };
export const Wide: Story = { args: { image: { src, alt: "Wide", aspect: "wide" } } };
