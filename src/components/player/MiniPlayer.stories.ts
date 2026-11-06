import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { mocked } from "storybook/test";
import { getItemPlaybackInfo } from "../../api";
import { useAudioPlayer } from "../../composables/useAudioPlayer";
import MiniPlayer from "./MiniPlayer.vue";

const meta = {
	title: "Player/MiniPlayer",
	component: MiniPlayer,
	tags: ["autodocs"],
	parameters: { layout: "fullscreen" },
	decorators: [() => ({ template: '<div class="h-48"><story /></div>' })],
	beforeEach: () => {
		mocked(getItemPlaybackInfo).mockReturnValue(new Promise(() => undefined));
		useAudioPlayer().playQueue(
			[
				{ id: "track-1", title: "Midnight City", artist: "M83", artistId: "artist-1", album: "Hurry Up, We're Dreaming", albumId: "album-1", art: null },
				{ id: "track-2", title: "Wait", artist: "M83", artistId: "artist-1", album: "Hurry Up, We're Dreaming", albumId: "album-1", art: null },
			],
			0,
		);
		return () => useAudioPlayer().stop();
	},
} satisfies Meta<typeof MiniPlayer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
