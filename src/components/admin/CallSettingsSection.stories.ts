import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { mocked } from "storybook/test";
import { listSettings, updateSetting, type ServerSetting } from "../../api";
import CallSettingsSection from "./CallSettingsSection.vue";

const setting = (key: string, value: unknown): ServerSetting => ({ key, value, isPublic: false, updatedAt: new Date().toISOString() });

const meta = {
	title: "Admin/CallSettingsSection",
	component: CallSettingsSection,
	tags: ["autodocs"],
	decorators: [() => ({ template: '<div class="w-[640px]"><story /></div>' })],
	beforeEach: () => {
		mocked(listSettings).mockResolvedValue([setting("calls_enabled", true), setting("calls_relay_only", false), setting("calls_stun_urls", ["stun:stun.l.google.com:19302"]), setting("calls_turn_urls", ["turn:turn.example.com:3478"]), setting("calls_turn_username", "flixer"), setting("calls_turn_secret", "stored-secret")]);
		mocked(updateSetting).mockImplementation(async (key, value) => setting(key, value));
	},
} satisfies Meta<typeof CallSettingsSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Configured: Story = {};
export const Disabled: Story = {
	beforeEach: () => {
		mocked(listSettings).mockResolvedValue([]);
	},
};
export const LoadError: Story = {
	beforeEach: () => {
		mocked(listSettings).mockRejectedValue(new Error("Network error"));
	},
};
