import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { adminOverview } from "../../../storybook/fixturesAdmin";
import ContentMixWidget from "./ContentMixWidget.vue";

const meta = {
	title: "Admin/Dashboard/ContentMixWidget",
	component: ContentMixWidget,
	tags: ["autodocs"],
	args: { overview: adminOverview },
	decorators: [() => ({ template: '<div class="h-56 w-96"><story /></div>' })],
} satisfies Meta<typeof ContentMixWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const EmptyLibrary: Story = { args: { overview: { ...adminOverview, counts: { users: 1, movies: 0, series: 0, episodes: 0, albums: 0, tracks: 0 } } } };
