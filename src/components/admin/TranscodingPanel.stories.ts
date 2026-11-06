import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { mocked } from "storybook/test";
import { listSettings, updateSetting } from "../../api";
import { transcodingSettings } from "../../storybook/fixturesRequestsOps";
import TranscodingPanel from "./TranscodingPanel.vue";

const meta = {
	title: "Admin/TranscodingPanel",
	component: TranscodingPanel,
	tags: ["autodocs"],
	parameters: { layout: "padded" },
	beforeEach: () => {
		mocked(listSettings).mockResolvedValue(transcodingSettings);
		mocked(updateSetting).mockResolvedValue(transcodingSettings[0]);
	},
} satisfies Meta<typeof TranscodingPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Defaults: Story = { beforeEach: () => void mocked(listSettings).mockResolvedValue([]) };
export const Loading: Story = { beforeEach: () => void mocked(listSettings).mockReturnValue(new Promise(() => undefined)) };
export const LoadError: Story = { beforeEach: () => void mocked(listSettings).mockRejectedValue(new Error("Network error")) };
