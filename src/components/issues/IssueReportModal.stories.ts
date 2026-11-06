import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { mocked } from "storybook/test";
import { getIssueReportConfiguration } from "../../api";
import { useIssueReportsConfig } from "../../composables/useIssueReportsConfig";
import { modalStory } from "../../storybook/modalStory";
import IssueReportModal from "./IssueReportModal.vue";

const meta = {
	title: "Issues/IssueReportModal",
	component: IssueReportModal,
	tags: ["autodocs"],
	args: { mediaItemId: "movie1", mediaTitle: "Blade Runner 2049" },
	render: (args) => modalStory(IssueReportModal, args)(),
	beforeEach: () => {
		useIssueReportsConfig().config.value = null;
		mocked(getIssueReportConfiguration).mockResolvedValue({ enabled: true, categories: ["Playback", "Subtitles", "Audio", "Other"], chatEnabled: true });
	},
} satisfies Meta<typeof IssueReportModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ForMedia: Story = {};
export const General: Story = { args: { mediaItemId: undefined, mediaTitle: undefined } };
