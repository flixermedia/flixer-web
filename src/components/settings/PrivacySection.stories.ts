import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { createAgent } from "@ui-sdk/vue/agent";
import { expect, mocked, userEvent, waitFor } from "storybook/test";
import { acceptFriend, getFriends, getMySocialProfile, removeFriend, updateMySocialProfile } from "../../api";
import { friendsFixture, mySocialProfileFixture } from "../../storybook/fixturesAccount";
import PrivacySection from "./PrivacySection.vue";

const meta = {
	title: "Settings/PrivacySection",
	component: PrivacySection,
	tags: ["autodocs"],
	beforeEach: () => {
		mocked(getMySocialProfile).mockResolvedValue(mySocialProfileFixture);
		mocked(getFriends).mockResolvedValue(friendsFixture);
		mocked(updateMySocialProfile).mockImplementation(async (changes) => ({ ...mySocialProfileFixture, ...changes }) as never);
		mocked(acceptFriend).mockResolvedValue(undefined);
		mocked(removeFriend).mockResolvedValue(undefined);
	},
} satisfies Meta<typeof PrivacySection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const FriendActions: Story = {
	play: async ({ canvas }) => {
		const accept = await canvas.findByRole("button", { name: "Accept: jordan" });
		const agent = createAgent();
		const denied = await agent.act({ steps: [{ ref: "Accept: jordan", action: "press" }] });
		expect(denied.ok).toBe(false);
		expect(acceptFriend).not.toHaveBeenCalled();
		accept.focus();
		await userEvent.keyboard("{Enter}");
		await waitFor(() => expect(acceptFriend).toHaveBeenCalledWith("jordan"));
		await userEvent.click(canvas.getByRole("button", { name: "Remove: sam" }));
		await waitFor(() => expect(removeFriend).toHaveBeenCalledWith("sam"));
	},
};
export const FriendsOnly: Story = {
	beforeEach: () => {
		mocked(getMySocialProfile).mockResolvedValue({ ...mySocialProfileFixture, visibility: "friends" });
	},
};
export const NoFriends: Story = {
	beforeEach: () => {
		mocked(getFriends).mockResolvedValue({ friends: [], incoming: [], outgoing: [] });
	},
};
