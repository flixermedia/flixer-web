import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { mocked } from "storybook/test";
import { listMediaRequests } from "../../../api";
import RequestsWidget from "./RequestsWidget.vue";

const meta = {
	title: "Admin/Dashboard/RequestsWidget",
	component: RequestsWidget,
	tags: ["autodocs"],
	decorators: [() => ({ template: '<div class="h-28 w-96"><story /></div>' })],
	beforeEach: () => {
		mocked(listMediaRequests).mockResolvedValue({ total: 31, counts: { pending: 5, approved: 12, available: 12, failed: 2 }, items: [] });
	},
} satisfies Meta<typeof RequestsWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Loading: Story = {
	beforeEach: () => {
		mocked(listMediaRequests).mockReturnValue(new Promise(() => undefined));
	},
};
export const LoadError: Story = {
	beforeEach: () => {
		mocked(listMediaRequests).mockRejectedValue(new Error("Network error"));
	},
};
