import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { mocked } from "storybook/test";
import { getFriends, getMySocialProfile, getProfile, updateProfile } from "../../api";
import { useProfile } from "../../composables/useProfile";
import { friendsFixture, mySocialProfileFixture, profileFixture } from "../../storybook/fixturesAccount";
import ProfileSection from "./ProfileSection.vue";

const meta = {
	title: "Settings/ProfileSection",
	component: ProfileSection,
	tags: ["autodocs"],
	beforeEach: () => {
		useProfile().setProfile(profileFixture);
		mocked(getProfile).mockResolvedValue(profileFixture);
		mocked(updateProfile).mockResolvedValue(profileFixture);
		mocked(getMySocialProfile).mockResolvedValue(mySocialProfileFixture);
		mocked(getFriends).mockResolvedValue(friendsFixture);
	},
} satisfies Meta<typeof ProfileSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const PendingEmailChange: Story = {
	beforeEach: () => {
		const profile = { ...profileFixture, pendingEmail: "alex.new@example.com" };
		useProfile().setProfile(profile);
		mocked(getProfile).mockResolvedValue(profile);
	},
};
