import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { mocked } from "storybook/test";
import { listAdminUsers, listSettings, sendAdminNotification, updateSetting } from "../../api";
import { adminUsers, serverSettings } from "../../storybook/fixturesAdminAB";
import NotificationsPanel from "./NotificationsPanel.vue";

const meta = {
	title: "Admin/NotificationsPanel",
	component: NotificationsPanel,
	tags: ["autodocs"],
	parameters: { layout: "padded" },
	beforeEach: () => {
		mocked(listAdminUsers).mockResolvedValue(adminUsers);
		mocked(listSettings).mockResolvedValue(serverSettings);
		mocked(updateSetting).mockResolvedValue(serverSettings[0]);
		mocked(sendAdminNotification).mockResolvedValue({ recipients: 3, pushed: 2 });
	},
} satisfies Meta<typeof NotificationsPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Disabled: Story = {
	beforeEach: () => {
		mocked(listSettings).mockResolvedValue([
			{ key: "notifications_enabled", value: false, isPublic: false, updatedAt: "2026-10-01T10:00:00.000Z" },
			{ key: "notifications_vapid_subject", value: "mailto:admin@example.com", isPublic: false, updatedAt: "2026-10-01T10:00:00.000Z" },
		]);
	},
};
export const LoadError: Story = {
	beforeEach: () => {
		mocked(listAdminUsers).mockRejectedValue(new Error("Network error"));
	},
};
