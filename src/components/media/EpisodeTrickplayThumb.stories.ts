import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { mocked } from "storybook/test";
import { getItemPlaybackInfo, getTrickplay } from "../../api";
import { playbackInfoFixture, trickplayFixture } from "../../storybook/fixturesPlayer";
import EpisodeTrickplayThumb from "./EpisodeTrickplayThumb.vue";

const meta = {
	title: "Media/EpisodeTrickplayThumb",
	component: EpisodeTrickplayThumb,
	tags: ["autodocs"],
	args: { itemId: "episode-1" },
	decorators: [() => ({ template: '<div class="aspect-video w-80 overflow-hidden rounded bg-flixer-surface"><story /></div>' })],
} satisfies Meta<typeof EpisodeTrickplayThumb>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	beforeEach: () => {
		mocked(getItemPlaybackInfo).mockResolvedValue(playbackInfoFixture);
		mocked(getTrickplay).mockResolvedValue(trickplayFixture);
	},
};
export const NoTrickplay: Story = {
	beforeEach: () => {
		mocked(getItemPlaybackInfo).mockResolvedValue(playbackInfoFixture);
		mocked(getTrickplay).mockResolvedValue(null);
	},
};
export const Loading: Story = { beforeEach: () => void mocked(getItemPlaybackInfo).mockReturnValue(new Promise(() => undefined)) };
