import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, mocked, userEvent, waitFor } from "storybook/test";
import { getRequestWebhookCredentials, getRequestsConfig, listMediaLibraries, listRequestServices, listRequestUsers, listSettings, rotateRequestWebhookCredentials, updateRequestUser, updateSetting } from "../../api";
import { mediaLibraries } from "../../storybook/fixturesAdminAB";
import { requestServices, requestSettings, requestUsers, requestsConfig } from "../../storybook/fixturesRequestsOps";
import RequestsPanel from "./RequestsPanel.vue";

const meta = {
	title: "Admin/RequestsPanel",
	component: RequestsPanel,
	tags: ["autodocs"],
	parameters: { layout: "padded" },
	beforeEach: () => {
		mocked(listSettings).mockResolvedValue(requestSettings);
		mocked(listRequestServices).mockResolvedValue(requestServices);
		mocked(listRequestUsers).mockResolvedValue(requestUsers);
		mocked(getRequestsConfig).mockResolvedValue(requestsConfig);
		mocked(listMediaLibraries).mockResolvedValue(mediaLibraries);
		mocked(getRequestWebhookCredentials).mockResolvedValue({ username: "flixer", password: "whk_storybook_secret" });
		mocked(rotateRequestWebhookCredentials).mockResolvedValue({ username: "flixer", password: "whk_rotated_secret" });
		mocked(updateSetting).mockResolvedValue(requestSettings[0]);
		mocked(updateRequestUser).mockResolvedValue(requestUsers[1]);
	},
} satisfies Meta<typeof RequestsPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const SaveQuotaWithKeyboard: Story = {
	play: async ({ canvas }) => {
		const quota = canvas.getByRole("spinbutton", { name: /Request quota limit/ });
		await userEvent.clear(quota);
		await userEvent.type(quota, "25");
		await userEvent.tab();
		await waitFor(() => expect(mocked(updateSetting)).toHaveBeenCalledWith("requests_quota_limit", 25));
	},
};
export const NoServices: Story = {
	beforeEach: () => {
		mocked(listRequestServices).mockResolvedValue([]);
		mocked(getRequestsConfig).mockResolvedValue({ ...requestsConfig, tmdbConfigured: false, discogsConfigured: false });
	},
};
export const LoadError: Story = {
	beforeEach: () => {
		mocked(listRequestServices).mockRejectedValue(new Error("Network error"));
		mocked(listRequestUsers).mockRejectedValue(new Error("Network error"));
	},
};
