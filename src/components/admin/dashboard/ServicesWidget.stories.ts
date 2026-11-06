import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { adminOverview } from "../../../storybook/fixturesAdmin";
import ServicesWidget from "./ServicesWidget.vue";

const meta = {
	title: "Admin/Dashboard/ServicesWidget",
	component: ServicesWidget,
	tags: ["autodocs"],
	args: { overview: adminOverview },
	decorators: [() => ({ template: '<div class="h-56 w-96"><story /></div>' })],
} satisfies Meta<typeof ServicesWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const StreamerDown: Story = { args: { overview: { ...adminOverview, server: { ...adminOverview.server, streamer: { ...adminOverview.server.streamer, reachable: false } } } } };
