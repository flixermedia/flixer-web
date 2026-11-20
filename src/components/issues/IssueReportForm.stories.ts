import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { createAgent } from "@ui-sdk/vue/agent";
import { expect, fn, mocked, userEvent, waitFor } from "storybook/test";
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

export const FormInteraction: Story = {
	args: { mediaItemId: undefined, mediaTitle: undefined },
	play: async ({ canvas, args }) => {
		const subject = await canvas.findByRole("textbox", { name: "Subject" });
		const description = canvas.getByRole("textbox", { name: "Description" });
		const submit = canvas.getByRole("button", { name: "Submit report" });
		await expect(subject).toBeRequired();
		await expect(description).toBeRequired();
		await expect(submit).toBeDisabled();
		const agent = createAgent();
		const entries = agent.snapshot().filter((entry) => !entry.offPage);
		for (const label of ["Subject", "Description", "Submit report"]) {
			await expect(entries.some((entry) => entry.label === label), label).toBe(true);
		}
		const result = await agent.act({ steps: [
			{ ref: "Subject", action: "setValue", args: ["  Video issue  "] },
			{ ref: "Description", action: "setValue", args: ["  Stutters  "] },
		] });
		await expect(result.ok, result.error?.message).toBe(true);
		await userEvent.selectOptions(canvas.getByRole("combobox", { name: "Category" }), "Subtitles");
		const denied = await agent.act({ steps: [{ ref: "Submit report", action: "press" }] });
		await expect(denied.ok).toBe(false);
		await expect(denied.error?.message).toContain("Needs a person");
		await userEvent.click(submit);
		await waitFor(() => expect(mocked(createIssueReport)).toHaveBeenCalledWith({
			title: "Video issue", category: "Subtitles", description: "Stutters", mediaItemId: undefined,
		}));
		await waitFor(() => expect(args.onSubmitted).toHaveBeenCalledWith(report));
	},
};
