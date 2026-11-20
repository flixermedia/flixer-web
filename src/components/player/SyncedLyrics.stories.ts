import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, fn, userEvent, waitFor } from "storybook/test";
import SyncedLyrics from "./SyncedLyrics.vue";

const meta = {
	title: "Player/SyncedLyrics",
	component: SyncedLyrics,
	parameters: { layout: "fullscreen" },
	decorators: [() => ({ template: '<div style="height: 600px; max-height: 100dvh; background: #101014"><story /></div>' })],
	args: {
		lyrics: {
			synced: true,
			lines: [
				{ time: 10, text: "One & <two>", words: [{ time: 10, text: "One & " }, { time: 11, text: "<two>" }] },
				{ time: 20, text: "Next line" },
				{ time: 22, text: "" },
				{ time: 35, text: "Last line" },
			],
		},
		currentTime: 10.5,
		duration: 40,
		paused: true,
		onSeek: fn(),
	},
} satisfies Meta<typeof SyncedLyrics>;

export default meta;
type Story = StoryObj<typeof meta>;

export const LocalWordTimings: Story = {
	play: async ({ canvasElement, args }) => {
		await waitFor(() => expect(canvasElement.querySelectorAll(".lyric-line")).toHaveLength(4));
		const active = canvasElement.querySelector<HTMLElement>(".is-active .lyric-button")!;
		expect(active.textContent).toBe("One & <two>");
		expect(active.querySelectorAll(".lyric-word")).toHaveLength(2);
		expect(active.querySelector(".lyric-word")?.getAttribute("style")).toContain("50%");
		expect(canvasElement.querySelectorAll("am-lyrics")).toHaveLength(0);
		await userEvent.click(active);
		expect(args.onSeek).toHaveBeenCalledWith(10);
		expect(args.onSeek).toHaveBeenCalledTimes(1);
	},
};