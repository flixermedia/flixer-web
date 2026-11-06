import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { mocked } from "storybook/test";
import { listAdminScheduledTasks, runAdminScheduledTask, saveAdminScheduledTaskSchedule, stopAdminScheduledTask } from "../../api";
import { scheduledTasks } from "../../storybook/fixturesRequestsOps";
import TasksPanel from "./TasksPanel.vue";

const meta = {
	title: "Admin/TasksPanel",
	component: TasksPanel,
	tags: ["autodocs"],
	parameters: { layout: "padded" },
	beforeEach: () => {
		mocked(listAdminScheduledTasks).mockResolvedValue(scheduledTasks);
		mocked(runAdminScheduledTask).mockResolvedValue(undefined);
		mocked(stopAdminScheduledTask).mockResolvedValue(undefined);
		mocked(saveAdminScheduledTaskSchedule).mockResolvedValue(undefined);
	},
} satisfies Meta<typeof TasksPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Empty: Story = { beforeEach: () => void mocked(listAdminScheduledTasks).mockResolvedValue([]) };
export const Loading: Story = { beforeEach: () => void mocked(listAdminScheduledTasks).mockReturnValue(new Promise(() => undefined)) };
export const LoadError: Story = { beforeEach: () => void mocked(listAdminScheduledTasks).mockRejectedValue(new Error("Network error")) };
