import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { mocked } from "storybook/test";
import { getItemPlaybackInfo } from "../../api";
import { useAudioPlayer } from "../../composables/useAudioPlayer";
import AudioEngineDebug from "./AudioEngineDebug.vue";

const meta = {
	title: "Player/AudioEngineDebug",
	component: AudioEngineDebug,
	tags: ["autodocs"],
	parameters: {
		layout: "fullscreen",
		docs: { description: { component: "Dev-only badge: it renders only in development builds while a track is loaded." } },
	},
	beforeEach: () => {
		mocked(getItemPlaybackInfo).mockRejectedValue(new Error("No stream in Storybook"));
		useAudioPlayer().playQueue([{ id: "track-1", title: "Midnight City", artist: "M83", artistId: "artist-1", album: "Hurry Up, We're Dreaming", albumId: "album-1", art: null }]);
	},
} satisfies Meta<typeof AudioEngineDebug>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
