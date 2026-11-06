import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { mocked } from "storybook/test";
import { cancelStreamSession, listStreamSessions } from "../../api";
import { streamSessions } from "../../storybook/fixturesRequestsOps";
import StreamSessionsPanel from "./StreamSessionsPanel.vue";

const meta = {
	title: "Admin/StreamSessionsPanel",
	component: StreamSessionsPanel,
	tags: ["autodocs"],
	parameters: { layout: "padded" },
	beforeEach: () => {
		mocked(listStreamSessions).mockResolvedValue(streamSessions);
		mocked(cancelStreamSession).mockResolvedValue(undefined);
	},
} satisfies Meta<typeof StreamSessionsPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const NoSessions: Story = { beforeEach: () => void mocked(listStreamSessions).mockResolvedValue({ ...streamSessions, sessions: [], activeTranscodes: 0 }) };
export const Loading: Story = { beforeEach: () => void mocked(listStreamSessions).mockReturnValue(new Promise(() => undefined)) };
export const LoadError: Story = { beforeEach: () => void mocked(listStreamSessions).mockRejectedValue(new Error("Network error")) };
