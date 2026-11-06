import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { fn, mocked } from "storybook/test";
import { deleteNetworkShare, getNetworkShareSupport, listNetworkShares, reconnectNetworkShare } from "../../api";
import { networkShares } from "../../storybook/fixturesMediaAdmin";
import NetworkSharesSection from "./NetworkSharesSection.vue";

const meta = {
	title: "Admin/NetworkSharesSection",
	component: NetworkSharesSection,
	tags: ["autodocs"],
	parameters: { layout: "padded" },
	args: { onChanged: fn() },
	beforeEach: () => {
		mocked(getNetworkShareSupport).mockResolvedValue({ supported: true });
		mocked(listNetworkShares).mockResolvedValue(networkShares);
		mocked(reconnectNetworkShare).mockResolvedValue({ ...networkShares[1], status: "connected", error: null });
		mocked(deleteNetworkShare).mockResolvedValue(undefined);
	},
} satisfies Meta<typeof NetworkSharesSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Empty: Story = {
	beforeEach: () => {
		mocked(listNetworkShares).mockResolvedValue([]);
	},
};
export const Loading: Story = {
	beforeEach: () => {
		mocked(listNetworkShares).mockReturnValue(new Promise(() => undefined));
	},
};
export const LoadError: Story = {
	beforeEach: () => {
		mocked(listNetworkShares).mockRejectedValue(new Error("Network error"));
	},
};
