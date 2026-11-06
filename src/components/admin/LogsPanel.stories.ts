import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { mocked } from "storybook/test";
import { getAccessToken } from "../../api";
import type { LiveLogEntry } from "../../composables/useLiveLogs";
import LogsPanel from "./LogsPanel.vue";

const now = Date.now();
const entries: LiveLogEntry[] = [
	{ id: 1, time: new Date(now - 60_000).toISOString(), level: "info", app: "flixer-api", source: "http", message: "GET /api/media 200", fields: { ms: 14, user: "alice" } },
	{ id: 2, time: new Date(now - 45_000).toISOString(), level: "debug", app: "flixer-api", source: "scanner", message: "Scanning /media/Movies" },
	{ id: 3, time: new Date(now - 30_000).toISOString(), level: "warn", app: "streamer", source: "transcode", message: "Transcode queue is full", fields: { active: 4, max: 4 } },
	{ id: 4, time: new Date(now - 10_000).toISOString(), level: "error", app: "flixer-api", source: "mail", message: "SMTP relay refused connection", fields: { host: "smtp.example.com" } },
];

/** Replaces the browser WebSocket with a stub that answers the auth handshake with a log snapshot. */
function fakeSocket(snapshot: LiveLogEntry[]) {
	const original = window.WebSocket;
	class FakeSocket {
		onopen: (() => void) | null = null;
		onmessage: ((event: { data: string }) => void) | null = null;
		onclose: ((event: { code: number }) => void) | null = null;
		constructor() {
			setTimeout(() => {
				this.onopen?.();
				this.onmessage?.({ data: JSON.stringify({ type: "snapshot", entries: snapshot }) });
			}, 50);
		}
		send() {}
		close() {}
	}
	window.WebSocket = FakeSocket as unknown as typeof WebSocket;
	return () => {
		window.WebSocket = original;
	};
}

const meta = {
	title: "Admin/LogsPanel",
	component: LogsPanel,
	tags: ["autodocs"],
	parameters: { layout: "padded" },
	beforeEach: () => {
		mocked(getAccessToken).mockReturnValue("storybook-token");
		return fakeSocket(entries);
	},
} satisfies Meta<typeof LogsPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Live: Story = {};
export const Empty: Story = {
	beforeEach: () => {
		mocked(getAccessToken).mockReturnValue("storybook-token");
		return fakeSocket([]);
	},
};
export const Unauthorized: Story = {
	beforeEach: () => {
		mocked(getAccessToken).mockReturnValue(null);
	},
};
