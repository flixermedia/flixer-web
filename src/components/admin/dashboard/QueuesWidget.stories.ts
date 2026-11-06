import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { mocked } from "storybook/test";
import { getIndexerStatus } from "../../../api";
import { indexerStatus } from "../../../storybook/fixturesAdmin";
import QueuesWidget from "./QueuesWidget.vue";

const meta = {
	title: "Admin/Dashboard/QueuesWidget",
	component: QueuesWidget,
	tags: ["autodocs"],
	decorators: [() => ({ template: '<div class="h-56 w-96"><story /></div>' })],
	beforeEach: () => {
		mocked(getIndexerStatus).mockResolvedValue(indexerStatus);
	},
} satisfies Meta<typeof QueuesWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Offline: Story = {
	beforeEach: () => {
		mocked(getIndexerStatus).mockResolvedValue({ ...indexerStatus, reachable: false });
	},
};
export const Loading: Story = {
	beforeEach: () => {
		mocked(getIndexerStatus).mockReturnValue(new Promise(() => undefined));
	},
};
export const LoadError: Story = {
	beforeEach: () => {
		mocked(getIndexerStatus).mockRejectedValue(new Error("Network error"));
	},
};
