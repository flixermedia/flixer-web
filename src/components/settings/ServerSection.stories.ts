import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { mocked } from "storybook/test";
import { listSettings, updateSetting } from "../../api";
import { serverSettingsFixture } from "../../storybook/fixturesAccount";
import ServerSection from "./ServerSection.vue";

const meta = {
	title: "Settings/ServerSection",
	component: ServerSection,
	tags: ["autodocs"],
	beforeEach: () => {
		mocked(listSettings).mockResolvedValue(serverSettingsFixture);
		mocked(updateSetting).mockImplementation(async (key, value) => ({ key, value, isPublic: false, updatedAt: new Date().toISOString() }) as never);
	},
} satisfies Meta<typeof ServerSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const RegistrationClosed: Story = {
	beforeEach: () => {
		mocked(listSettings).mockResolvedValue(serverSettingsFixture.map((setting) => (setting.key === "registration_enabled" ? { ...setting, value: false } : setting)));
	},
};
export const Loading: Story = {
	beforeEach: () => {
		mocked(listSettings).mockReturnValue(new Promise(() => undefined));
	},
};
