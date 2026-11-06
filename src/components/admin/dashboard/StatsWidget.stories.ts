import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { adminOverview } from "../../../storybook/fixturesAdmin";
import StatsWidget from "./StatsWidget.vue";

const meta = {
	title: "Admin/Dashboard/StatsWidget",
	component: StatsWidget,
	tags: ["autodocs"],
	args: { overview: adminOverview },
	decorators: [() => ({ template: '<div class="h-56 w-96"><story /></div>' })],
} satisfies Meta<typeof StatsWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
