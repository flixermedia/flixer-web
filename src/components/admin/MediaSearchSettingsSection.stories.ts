import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { mocked } from "storybook/test";
import { getMediaSearchAdminStatus, getMediaSearchTask, rebuildMediaSearchIndex, resetMediaSearchIndex, saveMediaSearchAdminSettings } from "../../api/admin";
import { searchStatus, searchTask } from "../../storybook/fixturesMediaAdmin";
import MediaSearchSettingsSection from "./MediaSearchSettingsSection.vue";

const meta = {
	title: "Admin/MediaSearchSettingsSection",
	component: MediaSearchSettingsSection,
	tags: ["autodocs"],
	parameters: { layout: "padded" },
	decorators: [() => ({ template: '<div class="w-[800px]"><story /></div>' })],
	beforeEach: () => {
		mocked(getMediaSearchAdminStatus).mockResolvedValue(searchStatus);
		mocked(getMediaSearchTask).mockResolvedValue(searchTask);
		mocked(saveMediaSearchAdminSettings).mockResolvedValue(searchStatus);
		mocked(rebuildMediaSearchIndex).mockResolvedValue(undefined as never);
		mocked(resetMediaSearchIndex).mockResolvedValue(undefined as never);
	},
} satisfies Meta<typeof MediaSearchSettingsSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Connected: Story = {};
export const Disconnected: Story = {
	beforeEach: () => {
		mocked(getMediaSearchAdminStatus).mockResolvedValue({ ...searchStatus, connected: false, indexExists: false, documentCount: 0, tasks: [], error: "connect ECONNREFUSED 127.0.0.1:7700" });
	},
};
export const Disabled: Story = {
	beforeEach: () => {
		mocked(getMediaSearchAdminStatus).mockResolvedValue({ ...searchStatus, enabled: false, connected: false, tasks: [] });
	},
};
export const Loading: Story = {
	beforeEach: () => {
		mocked(getMediaSearchAdminStatus).mockReturnValue(new Promise(() => undefined));
	},
};
export const LoadError: Story = {
	beforeEach: () => {
		mocked(getMediaSearchAdminStatus).mockRejectedValue(new Error("Network error"));
	},
};
