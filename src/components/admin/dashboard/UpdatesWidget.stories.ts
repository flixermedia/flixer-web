import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { mocked } from "storybook/test";
import { getUpdateStatus, type UpdateStatus } from "../../../api";
import UpdatesWidget from "./UpdatesWidget.vue";

const status: UpdateStatus = { components: [], updatesAvailable: 0, lastCheckedAt: new Date(Date.now() - 600_000).toISOString(), canApply: true, updaterReachable: true, run: null, backups: [] };

const meta = {
	title: "Admin/Dashboard/UpdatesWidget",
	component: UpdatesWidget,
	tags: ["autodocs"],
	render: () => ({ components: { UpdatesWidget }, template: '<div class="w-72"><UpdatesWidget /></div>' }),
} satisfies Meta<typeof UpdatesWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

export const UpToDate: Story = { beforeEach: () => void mocked(getUpdateStatus).mockResolvedValue(status) };
export const UpdatesAvailable: Story = { beforeEach: () => void mocked(getUpdateStatus).mockResolvedValue({ ...status, updatesAvailable: 3 }) };
export const UpdaterOffline: Story = { beforeEach: () => void mocked(getUpdateStatus).mockResolvedValue({ ...status, updaterReachable: false }) };
export const Loading: Story = { beforeEach: () => void mocked(getUpdateStatus).mockReturnValue(new Promise(() => undefined)) };
export const LoadError: Story = { beforeEach: () => void mocked(getUpdateStatus).mockRejectedValue(new Error("Network error")) };
