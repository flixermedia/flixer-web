import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { fn, mocked } from "storybook/test";
import { deleteItemSubtitle, downloadItemSubtitle, listItemSubtitles, searchItemSubtitles } from "../../api";
import { subtitleResults, subtitleTracks } from "../../storybook/fixturesRequestsOps";
import SubtitlePanel from "./SubtitlePanel.vue";

const meta = {
	title: "Admin/SubtitlePanel",
	component: SubtitlePanel,
	tags: ["autodocs"],
	args: { itemId: "item-1", onChanged: fn() },
	render: (args) => ({ components: { SubtitlePanel }, setup: () => ({ args }), template: '<div class="w-[44rem]"><SubtitlePanel v-bind="args" /></div>' }),
	beforeEach: () => {
		mocked(listItemSubtitles).mockResolvedValue({ configured: true, tracks: subtitleTracks });
		mocked(searchItemSubtitles).mockResolvedValue(subtitleResults);
		mocked(downloadItemSubtitle).mockResolvedValue(undefined);
		mocked(deleteItemSubtitle).mockResolvedValue(undefined);
	},
} satisfies Meta<typeof SubtitlePanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const NoTracks: Story = { beforeEach: () => void mocked(listItemSubtitles).mockResolvedValue({ configured: true, tracks: [] }) };
export const NotConfigured: Story = { beforeEach: () => void mocked(listItemSubtitles).mockResolvedValue({ configured: false, tracks: [] }) };
export const Loading: Story = { beforeEach: () => void mocked(listItemSubtitles).mockReturnValue(new Promise(() => undefined)) };
export const LoadError: Story = { beforeEach: () => void mocked(listItemSubtitles).mockRejectedValue(new Error("Network error")) };
