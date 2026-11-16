import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, userEvent, waitFor } from "storybook/test";
import { useVideoOverlay } from "../composables/useVideoOverlay";
import { isTvMode } from "../platform/tvMode";
import { mockPlayerHelpers, sampleClipUrl } from "../storybook/fixturesPlayer";
import TvPlayerView from "./TvPlayerView.vue";

const meta = {
	title: "TV/TvPlayerView",
	component: TvPlayerView,
	parameters: { layout: "fullscreen" },
	beforeEach: () => {
		mockPlayerHelpers();
		isTvMode.value = true;
		useVideoOverlay().play({ id: "movie1", title: "Trailer", autoplay: false, trailer: { streamUrl: sampleClipUrl } });
		return () => {
			useVideoOverlay().close();
			isTvMode.value = false;
		};
	},
} satisfies Meta<typeof TvPlayerView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Trailer: Story = {
	play: async ({ canvas, canvasElement }) => {
		const player = canvas.getByRole("main", { name: "Trailer" });
		expect(player.getBoundingClientRect().width).toBeCloseTo(window.innerWidth, 0);
		expect(player.getBoundingClientRect().height).toBeCloseTo(window.innerHeight, 0);
		expect(canvas.queryByRole("dialog")).toBeNull();
		expect(canvas.getByRole("button", { name: "Back" })).toBeInTheDocument();
		const video = canvasElement.querySelector("video")!;
		await waitFor(() => expect(video.duration).toBeGreaterThan(0));
		expect(video.getAttribute("src")).toBe(sampleClipUrl);
		video.muted = true;
		await userEvent.click(canvas.getAllByRole("button", { name: "Play" })[0]!);
		await waitFor(() => expect(video.paused).toBe(false));
	},
};
