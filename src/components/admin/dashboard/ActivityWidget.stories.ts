import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { adminOverview } from "../../../storybook/fixturesAdmin";
import ActivityWidget from "./ActivityWidget.vue";

const meta = {
	title: "Admin/Dashboard/ActivityWidget",
	component: ActivityWidget,
	tags: ["autodocs"],
	args: { overview: adminOverview },
	decorators: [() => ({ template: '<div class="h-56 w-96"><story /></div>' })],
} satisfies Meta<typeof ActivityWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const NoActivity: Story = { args: { overview: { ...adminOverview, activity: [] } } };
