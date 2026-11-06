import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { mocked } from "storybook/test";
import { createNetworkShare, updateNetworkShare } from "../../api";
import { networkShares } from "../../storybook/fixturesMediaAdmin";
import { modalStory } from "../../storybook/modalStory";
import NetworkShareModal from "./NetworkShareModal.vue";

const meta = {
	title: "Admin/NetworkShareModal",
	component: NetworkShareModal,
	tags: ["autodocs"],
	parameters: { layout: "fullscreen" },
	render: (args) => modalStory(NetworkShareModal, args)(),
	beforeEach: () => {
		mocked(createNetworkShare).mockResolvedValue(networkShares[0]);
		mocked(updateNetworkShare).mockResolvedValue(networkShares[0]);
	},
} satisfies Meta<typeof NetworkShareModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const New: Story = {};
export const Edit: Story = { args: { share: networkShares[0] } };
export const SaveError: Story = {
	args: { share: networkShares[1] },
	beforeEach: () => {
		mocked(updateNetworkShare).mockRejectedValue(new Error("Could not connect to the share"));
	},
};
