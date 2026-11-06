import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { mocked } from "storybook/test";
import { getIndexerStatus } from "../../api";
import { indexerStatus } from "../../storybook/fixturesAdmin";
import IndexerQueuesSection from "./IndexerQueuesSection.vue";

const meta = {
	title: "Admin/IndexerQueuesSection",
	component: IndexerQueuesSection,
	tags: ["autodocs"],
	render: () => ({ components: { IndexerQueuesSection }, template: '<div class="max-w-4xl"><IndexerQueuesSection /></div>' }),
} satisfies Meta<typeof IndexerQueuesSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Busy: Story = { beforeEach: () => void mocked(getIndexerStatus).mockResolvedValue(indexerStatus) };
export const Paused: Story = { beforeEach: () => void mocked(getIndexerStatus).mockResolvedValue({ ...indexerStatus, queues: indexerStatus.queues.map((queue) => ({ ...queue, paused: true, active: 0 })) }) };
export const Idle: Story = { beforeEach: () => void mocked(getIndexerStatus).mockResolvedValue({ ...indexerStatus, queues: indexerStatus.queues.map((queue) => ({ ...queue, pending: 0, active: 0, retry: 0, failed: 0 })) }) };
export const LoadError: Story = { beforeEach: () => void mocked(getIndexerStatus).mockRejectedValue(new Error("Network error")) };
