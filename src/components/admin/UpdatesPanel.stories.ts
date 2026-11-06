import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { mocked } from "storybook/test";
import { applyUpdates, getUpdateStatus, listSettings, updateSetting } from "../../api";
import { serverSettings } from "../../storybook/fixturesAdminAB";
import { updateStatus } from "../../storybook/fixturesRequestsOps";
import UpdatesPanel from "./UpdatesPanel.vue";

const meta = {
	title: "Admin/UpdatesPanel",
	component: UpdatesPanel,
	tags: ["autodocs"],
	parameters: { layout: "padded" },
	beforeEach: () => {
		mocked(getUpdateStatus).mockResolvedValue(updateStatus);
		mocked(listSettings).mockResolvedValue([{ ...serverSettings[0], key: "updates_check_enabled", value: true }]);
		mocked(updateSetting).mockResolvedValue(serverSettings[0]);
		mocked(applyUpdates).mockResolvedValue(updateStatus.run as never);
	},
} satisfies Meta<typeof UpdatesPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const UpdatesAvailable: Story = {};
export const UpToDate: Story = {
	beforeEach: () => {
		mocked(getUpdateStatus).mockResolvedValue({ ...updateStatus, updatesAvailable: 0, components: updateStatus.components.map((component) => ({ ...component, latest: component.installed, updateAvailable: false })) });
	},
};
export const UpdaterUnreachable: Story = { beforeEach: () => void mocked(getUpdateStatus).mockResolvedValue({ ...updateStatus, updaterReachable: false, canApply: false }) };
export const Loading: Story = { beforeEach: () => void mocked(getUpdateStatus).mockReturnValue(new Promise(() => undefined)) };
export const LoadError: Story = { beforeEach: () => void mocked(getUpdateStatus).mockRejectedValue(new Error("Network error")) };
