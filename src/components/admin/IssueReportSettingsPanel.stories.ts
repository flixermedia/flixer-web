import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { mocked } from "storybook/test";
import { listSettings, updateSetting } from "../../api";
import IssueReportSettingsPanel from "./IssueReportSettingsPanel.vue";

const setting = (key: string, value: boolean | string[]) => ({ key, value, isPublic: false, updatedAt: "2026-10-01T10:00:00.000Z" });

const meta = {
	title: "Admin/IssueReportSettingsPanel",
	component: IssueReportSettingsPanel,
	tags: ["autodocs"],
	parameters: { layout: "padded" },
	decorators: [() => ({ template: '<div class="w-[720px]"><story /></div>' })],
	beforeEach: () => {
		mocked(listSettings).mockResolvedValue([setting("issue_reports_enabled", true), setting("issue_reports_chat_enabled", true), setting("issue_reports_categories", ["Playback", "Subtitles", "Metadata"])]);
		mocked(updateSetting).mockResolvedValue(undefined as never);
	},
} satisfies Meta<typeof IssueReportSettingsPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Disabled: Story = {
	beforeEach: () => {
		mocked(listSettings).mockResolvedValue([setting("issue_reports_enabled", false), setting("issue_reports_chat_enabled", false)]);
	},
};
export const Loading: Story = {
	beforeEach: () => {
		mocked(listSettings).mockReturnValue(new Promise(() => undefined));
	},
};
export const LoadError: Story = {
	beforeEach: () => {
		mocked(listSettings).mockRejectedValue(new Error("Network error"));
	},
};
