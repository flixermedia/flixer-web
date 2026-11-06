import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { mocked } from "storybook/test";
import { deleteItemSubtitle, downloadItemSubtitle, listItemSubtitles, searchItemSubtitles } from "../../api";
import { subtitleResults, subtitleTracks } from "../../storybook/fixturesRequestsOps";
import { modalStory } from "../../storybook/modalStory";
import SubtitleModal from "./SubtitleModal.vue";

const meta = {
	title: "Admin/SubtitleModal",
	component: SubtitleModal,
	tags: ["autodocs"],
	parameters: { layout: "fullscreen" },
	args: { itemId: "item-1", title: "Arrival (2016)" },
	render: (args) => modalStory(SubtitleModal, args)(),
	beforeEach: () => {
		mocked(listItemSubtitles).mockResolvedValue({ configured: true, tracks: subtitleTracks });
		mocked(searchItemSubtitles).mockResolvedValue(subtitleResults);
		mocked(downloadItemSubtitle).mockResolvedValue(undefined);
		mocked(deleteItemSubtitle).mockResolvedValue(undefined);
	},
} satisfies Meta<typeof SubtitleModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
