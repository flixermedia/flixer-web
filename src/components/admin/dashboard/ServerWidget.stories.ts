import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { adminOverview } from "../../../storybook/fixturesAdmin";
import ServerWidget from "./ServerWidget.vue";

const meta = {
	title: "Admin/Dashboard/ServerWidget",
	component: ServerWidget,
	tags: ["autodocs"],
	args: { overview: adminOverview },
	decorators: [() => ({ template: '<div class="h-56 w-96"><story /></div>' })],
} satisfies Meta<typeof ServerWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const ServicesOffline: Story = { args: { overview: { ...adminOverview, server: { ...adminOverview.server, streamer: { ...adminOverview.server.streamer, reachable: false }, indexer: { ...adminOverview.server.indexer, reachable: false } } } } };
