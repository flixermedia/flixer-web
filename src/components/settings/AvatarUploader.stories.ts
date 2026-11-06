import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { mocked } from "storybook/test";
import { removeAvatar, uploadAvatar } from "../../api";
import { useProfile } from "../../composables/useProfile";
import { profileFixture } from "../../storybook/fixturesAccount";
import AvatarUploader from "./AvatarUploader.vue";

const meta = {
	title: "Settings/AvatarUploader",
	component: AvatarUploader,
	tags: ["autodocs"],
	beforeEach: () => {
		useProfile().setProfile(profileFixture);
		mocked(uploadAvatar).mockResolvedValue(profileFixture);
		mocked(removeAvatar).mockResolvedValue(profileFixture);
	},
} satisfies Meta<typeof AvatarUploader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithAvatar: Story = {
	beforeEach: () => {
		useProfile().setProfile({ ...profileFixture, avatarUrl: "/avatar.png" });
	},
};
