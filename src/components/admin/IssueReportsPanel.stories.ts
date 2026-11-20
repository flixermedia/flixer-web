import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, mocked, userEvent, within } from "storybook/test";
import { addAdminIssueReportUpdate, deleteAdminIssueReport, getAdminIssueReport, listAdminIssueReports, setAdminIssueReportChat, setAdminIssueReportStatus } from "../../api";
import { issueReports } from "../../storybook/fixturesLeft00";
import IssueReportsPanel from "./IssueReportsPanel.vue";

const meta = {
	title: "Admin/IssueReportsPanel",
	component: IssueReportsPanel,
	tags: ["autodocs"],
	parameters: { layout: "padded" },
	decorators: [() => ({ template: '<div class="w-[960px]"><story /></div>' })],
	beforeEach: () => {
		mocked(listAdminIssueReports).mockResolvedValue(issueReports);
		mocked(getAdminIssueReport).mockImplementation(async (id) => issueReports.find((report) => report.id === id) ?? issueReports[0]!);
		mocked(setAdminIssueReportStatus).mockImplementation(async (id, status) => ({ ...issueReports.find((report) => report.id === id)!, status }));
		mocked(addAdminIssueReportUpdate).mockResolvedValue(issueReports[0]!);
		mocked(setAdminIssueReportChat).mockResolvedValue(issueReports[0]!);
		mocked(deleteAdminIssueReport).mockResolvedValue(undefined as never);
	},
} satisfies Meta<typeof IssueReportsPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const FilterAndOpenReport: Story = {
	play: async ({ canvasElement }) => {
		const page = within(canvasElement.ownerDocument.body);
		await page.findByText("Stuttering playback");
		const filter = page.getByRole("combobox", { name: /status/i });
		await userEvent.click(filter);
		await userEvent.click(await page.findByRole("option", { name: /closed/i }));
		await expect(page.queryByText("Stuttering playback")).not.toBeInTheDocument();
		await userEvent.click(await page.findByRole("button", { name: /duplicate episode/i }));
		await expect(mocked(getAdminIssueReport)).toHaveBeenCalledWith("issue-4");
	},
};
export const Empty: Story = {
	beforeEach: () => {
		mocked(listAdminIssueReports).mockResolvedValue([]);
	},
};
export const Loading: Story = {
	beforeEach: () => {
		mocked(listAdminIssueReports).mockReturnValue(new Promise(() => undefined));
	},
};
export const LoadError: Story = {
	beforeEach: () => {
		mocked(listAdminIssueReports).mockRejectedValue(new Error("Network error"));
	},
};
