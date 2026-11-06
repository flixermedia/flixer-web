import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { mocked } from "storybook/test";
import { listSettings, updateSetting, type ServerSetting } from "../../api";
import ChatEncryptionSettingsSection from "./ChatEncryptionSettingsSection.vue";

const setting = (key: string, value: unknown): ServerSetting => ({ key, value, isPublic: false, updatedAt: new Date().toISOString() });

const meta = {
	title: "Admin/ChatEncryptionSettingsSection",
	component: ChatEncryptionSettingsSection,
	tags: ["autodocs"],
	decorators: [() => ({ template: '<div class="w-[640px]"><story /></div>' })],
	beforeEach: () => {
		mocked(listSettings).mockResolvedValue([setting("chat_e2ee_enabled", true), setting("chat_user_downgrade_enabled", false)]);
		mocked(updateSetting).mockImplementation(async (key, value) => setting(key, value));
	},
} satisfies Meta<typeof ChatEncryptionSettingsSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Enabled: Story = {};
export const Disabled: Story = {
	beforeEach: () => {
		mocked(listSettings).mockResolvedValue([setting("chat_e2ee_enabled", false)]);
	},
};
export const LoadError: Story = {
	beforeEach: () => {
		mocked(listSettings).mockRejectedValue(new Error("Network error"));
	},
};
