import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { mocked } from "storybook/test";
import { getProfile, listPasskeys, setPasskeyRequired } from "../../api";
import { useProfile } from "../../composables/useProfile";
import { passkeysFixture, profileFixture } from "../../storybook/fixturesAccount";
import PasskeysSection from "./PasskeysSection.vue";

const withProfile = (passkeyRequired: boolean) => {
	const profile = { ...profileFixture, passkeyRequired };
	useProfile().setProfile(profile);
	mocked(getProfile).mockResolvedValue(profile);
};

const meta = {
	title: "Settings/PasskeysSection",
	component: PasskeysSection,
	tags: ["autodocs"],
	beforeEach: () => {
		withProfile(false);
		mocked(listPasskeys).mockResolvedValue(passkeysFixture);
		mocked(setPasskeyRequired).mockResolvedValue({ ...profileFixture, passkeyRequired: true });
	},
} satisfies Meta<typeof PasskeysSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Empty: Story = {
	beforeEach: () => {
		mocked(listPasskeys).mockResolvedValue([]);
	},
};
export const PasskeyRequired: Story = {
	beforeEach: () => {
		withProfile(true);
	},
};
export const Loading: Story = {
	beforeEach: () => {
		mocked(listPasskeys).mockReturnValue(new Promise(() => undefined));
	},
};
