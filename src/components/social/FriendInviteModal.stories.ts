import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { mocked } from "storybook/test";
import { createFriendInvite } from "../../api";
import { modalStory } from "../../storybook/modalStory";
import FriendInviteModal from "./FriendInviteModal.vue";

const meta = {
	title: "Social/FriendInviteModal",
	component: FriendInviteModal,
	tags: ["autodocs"],
	parameters: { layout: "fullscreen" },
	args: { username: "alex" },
	beforeEach: () => {
		mocked(createFriendInvite).mockResolvedValue({ token: "abc123def456", expiresAt: null });
	},
	render: (args) => modalStory(FriendInviteModal, args)(),
} satisfies Meta<typeof FriendInviteModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const CreationFails: Story = {
	beforeEach: () => {
		mocked(createFriendInvite).mockRejectedValue(new Error("Failed"));
	},
};
