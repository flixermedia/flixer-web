import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { closeModalsByGroup } from "@kolirt/vue-modal";
import { createAgent } from "@ui-sdk/vue/agent";
import { expect, fireEvent, mocked, userEvent, waitFor, within } from "storybook/test";
import { getAccessToken } from "../../api";
import { startRemotePlayback, stopRemotePlayback, type RemotePlaybackDevice } from "../../composables/useRemotePlayback";
import { modalStory } from "../../storybook/modalStory";
import RemotePlaybackControlModal from "./RemotePlaybackControlModal.vue";

type Message = { type: string; requestId?: string; targetClientId?: string; position?: number; command?: unknown };

class FixtureSocket extends EventTarget {
	static readonly CONNECTING = 0;
	static readonly OPEN = 1;
	static readonly CLOSED = 3;
	readyState = FixtureSocket.CONNECTING;
	messages: Message[] = [];

	send(data: string) { this.messages.push(JSON.parse(data) as Message); }
	close() { this.readyState = FixtureSocket.CLOSED; this.dispatchEvent(new Event("close")); }
	open() { this.readyState = FixtureSocket.OPEN; this.dispatchEvent(new Event("open")); }
	receive(message: object) { this.dispatchEvent(new MessageEvent("message", { data: JSON.stringify(message) })); }
}

let socket: FixtureSocket;
const device = (): RemotePlaybackDevice => ({
	clientId: "living-room",
	deviceName: "Living room",
	updatedAt: Date.now(),
	player: {
		kind: "video", title: "Sample movie", subtitle: "A sample", playing: false, position: 30, duration: 120,
		volume: 0.5, muted: false, audioTrackIndex: 0, subtitleId: "",
		audioTracks: [{ id: "0", label: "English" }, { id: "1", label: "French" }],
		subtitles: [{ id: "en", label: "English" }],
		chapters: [{ start: 0, title: "Opening" }, { start: 60, title: "Arrival" }],
		segments: [{ start: 20, end: 40, type: "intro" }],
		trickplay: { manifest: { intervalMs: 10000, thumbWidth: 160, thumbHeight: 90, columns: 1, rows: 1, count: 1, sheets: 1 } },
	},
});
const publish = (devices: RemotePlaybackDevice[]) => socket.receive({ type: "devices", devices });
const commands = () => socket.messages.filter((message) => message.type === "command").map((message) => message.command);

const meta = {
	title: "Player/RemotePlaybackControlModal",
	component: RemotePlaybackControlModal,
	tags: ["autodocs"],
	parameters: { layout: "fullscreen" },
	args: { clientId: "living-room" },
	beforeEach: () => {
		stopRemotePlayback();
		const originalWebSocket = window.WebSocket;
		class MockWebSocket extends FixtureSocket {
			constructor(_url: string | URL) { super(); socket = this; }
		}
		window.WebSocket = MockWebSocket as unknown as typeof WebSocket;
		mocked(getAccessToken).mockReturnValue("fixture-token");
		startRemotePlayback();
		socket.open();
		socket.receive({ type: "ready" });
		publish([device()]);
		return async () => {
			await closeModalsByGroup("default", { instantExit: true });
			stopRemotePlayback();
			window.WebSocket = originalWebSocket;
			mocked(getAccessToken).mockReset();
		};
	},
	render: (args) => modalStory(RemotePlaybackControlModal, args)(),
} satisfies Meta<typeof RemotePlaybackControlModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Offline: Story = {
	beforeEach: () => { publish([]); },
};
export const LiveWithoutSeek: Story = {
	beforeEach: () => {
		const live = device();
		live.player!.duration = 0;
		publish([live]);
	},
};

export const Controls: Story = {
	play: async () => {
		const page = within(document.body);
		const seek = await page.findByRole("slider", { name: "Seek on Living room" }) as HTMLInputElement;
		expect(seek).toHaveValue("30");
		await fireEvent.input(seek, { target: { value: "65" } });
		expect(commands()).toEqual([]);
		expect(page.getByText("Arrival")).toBeInTheDocument();
		const request = socket.messages.find((message) => message.type === "preview-request")!;
		expect(request).toMatchObject({ targetClientId: "living-room", position: 65 });
		socket.receive({ type: "preview-response", requestId: "stale", dataUrl: "data:image/png;base64,stale" });
		expect(document.querySelector('img[src^="data:image/png"]')).toBeNull();
		socket.receive({ type: "preview-response", requestId: request.requestId, dataUrl: "data:image/png;base64,iVBORw0KGgo=" });
		await waitFor(() => expect(document.querySelector('img[src^="data:image/png"]')).not.toBeNull());
		await fireEvent.change(seek, { target: { value: "65" } });
		expect(commands()).toEqual([{ action: "seek", position: 65 }]);
		await userEvent.click(page.getByRole("button", { name: "Seek to Arrival" }));
		const play = page.getByRole("button", { name: "Play on Living room" });
		const result = await createAgent().act({ steps: [{ ref: "Play on Living room", action: "press" }] });
		expect(result.ok).toBe(false);
		expect(commands()).toHaveLength(2);
		play.focus();
		await userEvent.keyboard("{Enter}");
		await userEvent.click(page.getByRole("button", { name: "Rewind 10 seconds" }));
		await userEvent.click(page.getByRole("button", { name: "Forward 10 seconds" }));
		await userEvent.click(page.getByRole("button", { name: "Skip Skip Intro" }));
		expect(commands()).toEqual([
			{ action: "seek", position: 65 }, { action: "seek", position: 60 }, { action: "play" },
			{ action: "seek", position: 20 }, { action: "seek", position: 40 }, { action: "seek", position: 40 },
		]);
		await userEvent.click(page.getByRole("button", { name: "Volume" }));
		await fireEvent.input(page.getByRole("slider", { name: "Volume" }), { target: { value: "0" } });
		expect(commands().at(-1)).toEqual({ action: "volume", volume: 0, muted: true });
		await userEvent.click(page.getByRole("button", { name: "Playback Settings" }));
		expect(page.queryByRole("slider", { name: "Volume" })).not.toBeInTheDocument();
		await userEvent.selectOptions(page.getByRole("combobox", { name: "Audio stream" }), "1");
		expect(commands().at(-1)).toEqual({ action: "audio-track", index: 1 });
		await userEvent.click(page.getByRole("button", { name: "Playback Settings" }));
		await userEvent.selectOptions(page.getByRole("combobox", { name: "Subtitles" }), "en");
		expect(commands().at(-1)).toEqual({ action: "subtitle", id: "en" });
		expect(socket.messages.filter((message) => message.type === "command").every((message) => message.targetClientId === "living-room")).toBe(true);
		const updated = device();
		updated.player!.playing = true;
		updated.player!.position = 70;
		publish([updated]);
		await page.findByRole("button", { name: "Pause on Living room" });
		expect(Number(seek.value)).toBeGreaterThan(69);
		expect(Number(seek.value)).toBeLessThan(71);
		publish([]);
		await expect(await page.findByRole("status")).toHaveTextContent("This device is no longer active.");
		expect(page.queryByRole("slider", { name: "Seek on Living room" })).not.toBeInTheDocument();
	},
};

export const CloseDuringScrub: Story = {
	play: async () => {
		const page = within(document.body);
		const seek = await page.findByRole("slider", { name: "Seek on Living room" });
		await fireEvent.input(seek, { target: { value: "30.25" } });
		await userEvent.click(page.getByRole("button", { name: "Close" }));
		await waitFor(() => expect(page.queryByRole("dialog")).not.toBeInTheDocument());
		expect(commands()).toEqual([]);
	},
};

export const OfflineInteraction: Story = {
	beforeEach: () => { publish([]); },
	play: async () => {
		const page = within(document.body);
		await expect(await page.findByRole("status")).toHaveTextContent("This device is no longer active.");
		expect(page.queryByRole("slider")).not.toBeInTheDocument();
		expect(commands()).toEqual([]);
	},
};

export const LiveInteraction: Story = {
	beforeEach: () => {
		const live = device();
		live.player!.duration = 0;
		publish([live]);
	},
	play: async () => {
		const page = within(document.body);
		await page.findByRole("button", { name: "Play on Living room" });
		expect(page.queryByRole("slider", { name: "Seek on Living room" })).not.toBeInTheDocument();
		expect(page.queryByRole("button", { name: "Seek to Arrival" })).not.toBeInTheDocument();
		expect(commands()).toEqual([]);
	},
};
