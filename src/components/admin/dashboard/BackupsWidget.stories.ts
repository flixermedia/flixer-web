import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { mocked } from "storybook/test";
import { getBackupStatus } from "../../../api";
import { backupStatus } from "../../../storybook/fixturesAdmin";
import BackupsWidget from "./BackupsWidget.vue";

const meta = {
	title: "Admin/Dashboard/BackupsWidget",
	component: BackupsWidget,
	tags: ["autodocs"],
	decorators: [() => ({ template: '<div class="h-56 w-96"><story /></div>' })],
	beforeEach: () => {
		mocked(getBackupStatus).mockResolvedValue(backupStatus);
	},
} satisfies Meta<typeof BackupsWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const NoBackups: Story = {
	beforeEach: () => {
		mocked(getBackupStatus).mockResolvedValue({ ...backupStatus, schedule: "off", backups: [] });
	},
};
export const Loading: Story = {
	beforeEach: () => {
		mocked(getBackupStatus).mockReturnValue(new Promise(() => undefined));
	},
};
export const LoadError: Story = {
	beforeEach: () => {
		mocked(getBackupStatus).mockRejectedValue(new Error("Network error"));
	},
};
