import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { fn, mocked } from "storybook/test";
import { createIssueReport, getIssueReportConfiguration, type IssueReport } from "../../api";
import { useIssueReportsConfig } from "../../composables/useIssueReportsConfig";
import IssueReportForm from "./IssueReportForm.vue";

const report: IssueReport = {
	id: "issue-1",
	title: "Issue with Blade Runner 2049",
	category: "Playback",
	description: "Stutters at the start.",
	status: "open",
	mediaItemId: "movie1",
	mediaTitle: "Blade Runner 2049",
	chatOpen: false,
	chatConversationId: null,
	createdAt: "2025-01-01T00:00:00.000Z",
	updatedAt: "2025-01-01T00:00:00.000Z",
	resolvedAt: null,
	requester: { username: "alex", displayName: "Alex Rivera" },
};

const meta = {
	title: "Issues/IssueReportForm",
	component: IssueReportForm,
	tags: ["autodocs"],
	args: { mediaItemId: "movie1", mediaTitle: "Blade Runner 2049", onSubmitted: fn() },
	decorators: [() => ({ template: '<div class="w-96"><story /></div>' })],
	beforeEach: () => {
		// The configuration is cached across stories, so each one starts from a clean slate.
		useIssueReportsConfig().config.value = null;
		mocked(getIssueReportConfiguration).mockResolvedValue({ enabled: true, categories: ["Playback", "Subtitles", "Audio", "Other"], chatEnabled: true });
		mocked(createIssueReport).mockResolvedValue(report);
	},
} satisfies Meta<typeof IssueReportForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ForMedia: Story = {};
export const General: Story = { args: { mediaItemId: undefined, mediaTitle: undefined } };
export const SubmitFails: Story = { beforeEach: () => void mocked(createIssueReport).mockRejectedValue(new Error("Could not create the report")) };
