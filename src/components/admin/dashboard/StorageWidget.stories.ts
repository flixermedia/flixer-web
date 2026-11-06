import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { adminOverview } from "../../../storybook/fixturesAdmin";
import StorageWidget from "./StorageWidget.vue";

const meta = {
	title: "Admin/Dashboard/StorageWidget",
	component: StorageWidget,
	tags: ["autodocs"],
	args: { overview: adminOverview },
	decorators: [() => ({ template: '<div class="h-56 w-96"><story /></div>' })],
} satisfies Meta<typeof StorageWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const NearlyFull: Story = { args: { overview: { ...adminOverview, storage: { usedBytes: 1.9e13, disks: [{ totalBytes: 2e13, freeBytes: 6e11, roots: ["/media"] }] } } } };
export const NoDisks: Story = { args: { overview: { ...adminOverview, storage: { usedBytes: 0, disks: [] } } } };
