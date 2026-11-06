import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { adminOverview } from "../../../storybook/fixturesAdmin";
import LibrariesWidget from "./LibrariesWidget.vue";

const meta = {
	title: "Admin/Dashboard/LibrariesWidget",
	component: LibrariesWidget,
	tags: ["autodocs"],
	args: { overview: adminOverview },
	decorators: [() => ({ template: '<div class="h-56 w-96"><story /></div>' })],
} satisfies Meta<typeof LibrariesWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const NoLibraries: Story = { args: { overview: { ...adminOverview, libraries: [] } } };
