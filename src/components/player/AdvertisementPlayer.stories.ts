import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, fn, mocked, userEvent, waitFor } from "storybook/test";
import { getItemPlaybackInfo } from "../../api/playback";
import { reportAdvertisementView } from "../../api/analytics";
import { playbackInfoFixture, sampleClipUrl } from "../../storybook/fixturesPlayer";
import AdvertisementPlayer from "./AdvertisementPlayer.vue";

const meta = {
	title: "Player/Advertisement",
	component: AdvertisementPlayer,
	parameters: { layout: "fullscreen" },
	args: {
		ad: { id: "ad-1", name: "Example", targetUrl: "https://example.com/", streamUrl: sampleClipUrl, atSeconds: 0, skipAfterSeconds: 1 },
		autoplay: false,
		onDone: fn(),
		onClose: fn(),
		onStarted: fn(),
	},
	decorators: [() => ({ template: '<div class="theme-dark aspect-video w-full max-w-4xl"><story /></div>' })],
} satisfies Meta<typeof AdvertisementPlayer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Skippable: Story = {
	play: async ({ canvas, canvasElement, args }) => {
		const video = canvasElement.querySelector("video");
		expect(video).not.toBeNull();
		await waitFor(() => expect(video?.duration).toBeGreaterThan(0), { timeout: 10000 });
		expect(video?.paused).toBe(true);
		expect(canvas.getByRole("link")).toHaveAttribute("href", "https://example.com/");
		expect(canvas.getByRole("link")).toHaveAttribute("rel", "noopener noreferrer");
		if (video) {
			video.muted = true;
			video.currentTime = 4;
			await waitFor(() => expect(video.seeking).toBe(false));
			expect(canvas.getByRole("button", { name: /skip in/i })).toBeDisabled();
			video.currentTime = 0;
			await waitFor(() => expect(video.seeking).toBe(false));
		}
		await userEvent.click(canvas.getByRole("button", { name: "Play" }));
		await waitFor(() => expect(video?.paused).toBe(false));
		await waitFor(() => expect(canvas.getByRole("button", { name: "Skip ad" })).toBeEnabled(), { timeout: 5000 });
		await userEvent.click(canvas.getByRole("button", { name: "Skip ad" }));
		expect(args.onStarted).toHaveBeenCalled();
		expect(args.onDone).toHaveBeenCalled();
	},
};

export const Unskippable: Story = {
	args: { ad: { ...meta.args.ad, skipAfterSeconds: null } },
	play: async ({ canvas }) => {
		expect(canvas.queryByRole("button", { name: /skip/i })).toBeNull();
	},
};

export const RefreshExpiredMidroll: Story = {
	args: { itemId: "movie1", ad: { ...meta.args.ad, atSeconds: 300, streamUrl: "/expired-token" } },
	beforeEach: () => void mocked(getItemPlaybackInfo).mockResolvedValue({
		...playbackInfoFixture,
		advertisements: [{ ...meta.args.ad, atSeconds: 300, streamUrl: sampleClipUrl }],
	}),
	play: async ({ canvasElement }) => {
		await waitFor(() => expect(canvasElement.querySelector("video")?.getAttribute("src")).toBe(sampleClipUrl));
		expect(getItemPlaybackInfo).toHaveBeenCalledWith("movie1");
		await waitFor(() => expect(canvasElement.querySelector("video")?.duration).toBeGreaterThan(0), { timeout: 10000 });
	},
};

export const RefreshFailureAndRetry: Story = {
	args: { itemId: "movie1", ad: { ...meta.args.ad, atSeconds: 300, skipAfterSeconds: 0 } },
	beforeEach: () => void mocked(getItemPlaybackInfo)
		.mockRejectedValueOnce(new Error("network unavailable"))
		.mockResolvedValue({ ...playbackInfoFixture, advertisements: [{ ...meta.args.ad, atSeconds: 300, skipAfterSeconds: 0 }] }),
	play: async ({ canvas, canvasElement }) => {
		await waitFor(() => expect(canvas.getByRole("alert")).toBeVisible());
		expect(canvas.getByRole("button", { name: "Skip ad" })).toBeDisabled();
		await userEvent.click(canvas.getByRole("button", { name: "Try Again" }));
		await waitFor(() => expect(canvas.queryByRole("alert")).toBeNull());
		await waitFor(() => expect(canvasElement.querySelector("video")?.getAttribute("src")).toBe(sampleClipUrl));
		expect(getItemPlaybackInfo).toHaveBeenCalledTimes(2);
	},
};

export const ReportsSkippedView: Story = {
	args: { itemId: "movie1", ad: { ...meta.args.ad, skipAfterSeconds: 1 } },
	beforeEach: () => {
		mocked(getItemPlaybackInfo).mockResolvedValue({ ...playbackInfoFixture, advertisements: [meta.args.ad] });
		mocked(reportAdvertisementView).mockResolvedValue();
	},
	play: async ({ canvas, canvasElement }) => {
		const video = await waitFor(() => {
			const element = canvasElement.querySelector("video");
			expect(element).not.toBeNull();
			return element!;
		});
		video.muted = true;
		await userEvent.click(canvas.getByRole("button", { name: "Play" }));
		await waitFor(() => expect(reportAdvertisementView).toHaveBeenCalledWith(expect.objectContaining({ advertisementId: "ad-1", completed: false, skipped: false })));
		await waitFor(() => expect(canvas.getByRole("button", { name: "Skip ad" })).toBeEnabled(), { timeout: 5000 });
		await userEvent.click(canvas.getByRole("button", { name: "Skip ad" }));
		await waitFor(() => expect(reportAdvertisementView).toHaveBeenCalledWith(expect.objectContaining({ advertisementId: "ad-1", skipped: true, completed: false })));
		const calls = mocked(reportAdvertisementView).mock.calls;
		expect(calls.at(-1)?.[0].watchedSeconds).toBeGreaterThan(0);
		expect(calls.at(-1)?.[0].id).toBe(calls[0]?.[0].id);
	},
};
