import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { mocked } from "storybook/test";
import { getIndexerTaskLogs } from "../../api";
import { taskLogs } from "../../storybook/fixturesRequestsOps";
import { modalStory } from "../../storybook/modalStory";
import TaskLogsModal from "./TaskLogsModal.vue";

const meta = {
	title: "Admin/TaskLogsModal",
	component: TaskLogsModal,
	tags: ["autodocs"],
	parameters: { layout: "fullscreen" },
	args: { queue: "metadata", id: "task-1", title: "Refresh metadata: Arrival (2016)" },
	render: (args) => modalStory(TaskLogsModal, args)(),
} satisfies Meta<typeof TaskLogsModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Completed: Story = { beforeEach: () => void mocked(getIndexerTaskLogs).mockResolvedValue({ ...taskLogs, state: "completed" }) };
export const Empty: Story = { beforeEach: () => void mocked(getIndexerTaskLogs).mockResolvedValue({ ...taskLogs, state: "completed", total: 0, entries: [] }) };
export const LoadError: Story = { beforeEach: () => void mocked(getIndexerTaskLogs).mockRejectedValue(new Error("Network error")) };
