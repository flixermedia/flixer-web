import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { mocked } from "storybook/test";
import { getChatEncryptionStatus } from "../../api";
import { useProfile } from "../../composables/useProfile";
import { profileFixture } from "../../storybook/fixturesAccount";
import ChatEncryptionSection from "./ChatEncryptionSection.vue";

const meta = {
	title: "Settings/ChatEncryptionSection",
	component: ChatEncryptionSection,
	tags: ["autodocs"],
	beforeEach: () => {
		useProfile().setProfile(profileFixture);
		mocked(getChatEncryptionStatus).mockResolvedValue({ supported: false, enabled: false, allowUserDowngrade: false });
	},
} satisfies Meta<typeof ChatEncryptionSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Unsupported: Story = {};
export const Loading: Story = {
	beforeEach: () => {
		mocked(getChatEncryptionStatus).mockReturnValue(new Promise(() => undefined));
	},
};
export const LoadFailed: Story = {
	beforeEach: () => {
		mocked(getChatEncryptionStatus).mockRejectedValue(new Error("Could not reach the server."));
	},
};
