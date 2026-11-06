import type { Meta, StoryObj } from "@storybook/vue3-vite";
import MusicBanner from "./MusicBanner.vue";

const meta = {
	title: "UI/MusicBanner",
	component: MusicBanner,
	tags: ["autodocs"],
	parameters: { layout: "padded" },
	decorators: [() => ({ template: '<div class="relative h-64 w-[48rem] overflow-hidden"><story /></div>' })],
} satisfies Meta<typeof MusicBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Seeded: Story = { args: { seed: "Kind of Blue" } };
export const AnotherSeed: Story = { args: { seed: "Abbey Road" } };
