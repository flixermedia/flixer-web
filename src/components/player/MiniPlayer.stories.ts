import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, fireEvent, mocked, userEvent, waitFor } from "storybook/test";
import { createAgent } from "@ui-sdk/vue/agent";
import { isTvMode } from "../../platform/tvMode";
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
export const DesktopVolume: Story = {
	beforeEach: () => {
		const previous = useAudioPlayer().volume.value;
		useAudioPlayer().setVolume(0.5);
		return () => useAudioPlayer().setVolume(previous);
	},
	play: async ({ canvas }) => {
		const slider = canvas.getByRole("slider", { name: "Volume" }) as HTMLInputElement;
		expect(slider.closest('[data-slot="slider"]')).not.toBeNull();
		canvas.getByRole("button", { name: "Lyrics" }).focus();
		await userEvent.tab();
		expect(document.activeElement).toBe(slider);
		await userEvent.keyboard("{ArrowLeft}");
		await waitFor(() => expect(useAudioPlayer().volume.value).toBeCloseTo(0.49));
		expect(document.activeElement).toBe(slider);
		await userEvent.keyboard("{Home}");
		await waitFor(() => expect(useAudioPlayer().volume.value).toBe(0));
		await fireEvent.input(slider, { target: { value: "0.35" } });
		await waitFor(() => expect(useAudioPlayer().volume.value).toBeCloseTo(0.35));
		const agent = createAgent();
		expect(agent.snapshot()).toEqual(expect.arrayContaining([expect.objectContaining({ component: "slider", label: "Volume" })]));
		await agent.act({ steps: [{ ref: "Volume", action: "setValue", args: [0.4] }] });
		await waitFor(() => expect(useAudioPlayer().volume.value).toBeCloseTo(0.4));
		const control = slider.closest('[data-slot="slider"]')!.querySelector('[data-slot="slider-control"]')!;
		const rect = control.getBoundingClientRect();
		await userEvent.pointer([
			{ keys: "[MouseLeft>]", target: control, coords: { clientX: rect.left + rect.width * 0.25, clientY: rect.top + rect.height / 2 } },
			{ target: control, coords: { clientX: rect.left + rect.width * 0.75, clientY: rect.top + rect.height / 2 } },
			{ keys: "[/MouseLeft]" },
		]);
		await waitFor(() => expect(useAudioPlayer().volume.value).toBeCloseTo(0.75, 1));
		expect(document.activeElement).toBe(slider);
		await userEvent.tab();
		expect(document.activeElement).toBe(canvas.getByRole("button", { name: "Close Player" }));
	},
};
export const TvVolume: Story = {
	beforeEach: () => {
		const previous = isTvMode.value;
		isTvMode.value = true;
		return () => { isTvMode.value = previous; };
	},
	play: async ({ canvas }) => {
		const slider = canvas.getByRole("slider", { name: "Volume" });
		expect(slider.tagName).toBe("INPUT");
		expect(slider.closest('[data-slot="slider"]')).toBeNull();
	},
};
