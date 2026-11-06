import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { mocked } from "storybook/test";
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
