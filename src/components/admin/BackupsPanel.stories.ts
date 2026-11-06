import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { mocked } from "storybook/test";
import { createBackup, deleteBackup, getBackupDownloadUrl, getBackupStatus, restoreBackup, setBackupPassphrase, updateSetting, uploadBackup, clearBackupPassphrase } from "../../api";
import { backupStatus } from "../../storybook/fixturesAdmin";
import BackupsPanel from "./BackupsPanel.vue";

const meta = {
	title: "Admin/BackupsPanel",
	component: BackupsPanel,
	tags: ["autodocs"],
	parameters: { layout: "padded" },
	decorators: [() => ({ template: '<div class="w-[900px]"><story /></div>' })],
	beforeEach: () => {
		mocked(getBackupStatus).mockResolvedValue(backupStatus);
		mocked(createBackup).mockResolvedValue({ id: "run-1", kind: "backup", startedAt: new Date().toISOString(), finishedAt: null, status: "running", step: "database", error: null, log: [] });
		mocked(restoreBackup).mockResolvedValue({ id: "run-2", kind: "restore", startedAt: new Date().toISOString(), finishedAt: null, status: "running", step: "database", error: null, log: [] });
		mocked(deleteBackup).mockResolvedValue(undefined);
		mocked(uploadBackup).mockResolvedValue(backupStatus.backups[0]!);
		mocked(setBackupPassphrase).mockResolvedValue(undefined);
		mocked(clearBackupPassphrase).mockResolvedValue(undefined);
		mocked(getBackupDownloadUrl).mockResolvedValue("#");
		mocked(updateSetting).mockResolvedValue({ key: "backup", value: null, isPublic: false, updatedAt: new Date().toISOString() });
	},
} satisfies Meta<typeof BackupsPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const NoBackups: Story = {
	beforeEach: () => {
		mocked(getBackupStatus).mockResolvedValue({ ...backupStatus, backups: [], schedule: "off", passphraseSet: false, lastScheduledAt: null });
	},
};
export const BackupRunning: Story = {
	beforeEach: () => {
		const startedAt = new Date().toISOString();
		mocked(getBackupStatus).mockResolvedValue({
			...backupStatus,
			run: { id: "run-1", kind: "backup", startedAt, finishedAt: null, status: "running", step: "database", error: null, log: ["Dumping database"], steps: [{ name: "database", message: "Dumping database", status: "running", startedAt }] },
		});
	},
};
export const UpdaterUnreachable: Story = {
	beforeEach: () => {
		mocked(getBackupStatus).mockResolvedValue({ ...backupStatus, updaterReachable: false, canRestore: false });
	},
};
export const LoadError: Story = {
	beforeEach: () => {
		mocked(getBackupStatus).mockRejectedValue(new Error("Network error"));
	},
};
