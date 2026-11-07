import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { closeAllModals } from "@kolirt/vue-modal";
import { expect, spyOn, userEvent, waitFor, within } from "storybook/test";
import { LoggerClient } from "../../api/logger";
import { modalStory } from "../../storybook/modalStory";
import TaskLogsModal from "./TaskLogsModal.vue";

const meta = {
	title: "Admin/TaskLogsModal",
	component: TaskLogsModal,
	tags: ["autodocs"],
	parameters: { layout: "fullscreen" },
	beforeEach: async () => {
		await closeAllModals({ ignoreGuard: true, instantExit: true });
		return async () => { await closeAllModals({ ignoreGuard: true, instantExit: true }); };
	},
	args: { queue: "metadata", id: "task-1", title: "Refresh metadata: Arrival (2016)" },
	render: (args) => modalStory(TaskLogsModal, args)(),
} satisfies Meta<typeof TaskLogsModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const LoggerEvents: Story = {
	beforeEach: () => {
		const search = spyOn(LoggerClient.prototype, "search");
		search.mockResolvedValueOnce({
			events: [{ event_id: "one", time: "2026-01-01T00:00:00Z", ingested_at: "2026-01-01T00:00:00Z", level: "info", app: "flixer-indexer", instance_id: "node", message: "first task event", fields: { library: "movies" } }],
			next_cursor: "cursor-one",
		}).mockResolvedValueOnce({
			events: [{ event_id: "two", time: "2026-01-01T00:00:01Z", ingested_at: "2026-01-01T00:00:01Z", level: "warn", app: "flixer-indexer", instance_id: "node", message: "later task event" }],
			next_cursor: "cursor-two",
		}).mockResolvedValue({ events: [], next_cursor: "" });
		return () => search.mockRestore();
	},
	play: async () => {
		const page = within(document.body);
		await waitFor(() => expect(page.getByText(/first task event/)).toBeVisible());
		await userEvent.click(page.getByText("Event details"));
		await expect(page.getByText(/"library": "movies"/)).toBeVisible();
		await waitFor(() => expect(page.getByText(/later task event/)).toBeVisible(), { timeout: 5000 });
		expect(LoggerClient.prototype.search).toHaveBeenNthCalledWith(2, expect.objectContaining({
			order: "oldest", follow: true, cursor: "cursor-one",
			fields: { app: "flixer-indexer", task: "task-1", task_queue: "metadata" },
		}));
	},
};

export const LoggerError: Story = {
	beforeEach: () => {
		const search = spyOn(LoggerClient.prototype, "search").mockRejectedValueOnce(new Error("unavailable"))
			.mockResolvedValue({ events: [], next_cursor: "" });
		return () => search.mockRestore();
	},
	play: async () => {
		const page = within(document.body);
		await expect(await page.findByRole("alert")).toHaveTextContent("Could not load logger events");
		await userEvent.click(page.getByRole("button", { name: "Retry" }));
		await waitFor(() => expect(page.getByText("No matching logger events in this time window.")).toBeVisible());
	},
};
