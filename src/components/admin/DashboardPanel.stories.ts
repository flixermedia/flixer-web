import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { mocked } from "storybook/test";
import { onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";
import { getAccessToken, getAdminOverview, getBackupStatus, getIndexerStatus, getPreferences, getUpdateStatus, listAdminUsers, listMediaRequests, listStreamSessions, updatePreferences, type UpdateStatus } from "../../api";
import type { LiveLogEntry } from "../../composables/useLiveLogs";
import { adminOverview, backupStatus, indexerStatus } from "../../storybook/fixturesAdmin";
import { adminUsers } from "../../storybook/fixturesAdminAB";
import { streamSessions } from "../../storybook/fixturesRequestsOps";
import DashboardPanel from "./DashboardPanel.vue";

const updateStatus: UpdateStatus = { components: [], updatesAvailable: 0, lastCheckedAt: new Date(Date.now() - 600_000).toISOString(), canApply: true, updaterReachable: true, run: null, backups: [] };

const logs: LiveLogEntry[] = [
	{ id: 1, time: new Date(Date.now() - 60_000).toISOString(), level: "info", app: "flixer-api", source: "http", message: "GET /api/media 200", fields: { ms: 14 } },
	{ id: 2, time: new Date(Date.now() - 30_000).toISOString(), level: "warn", app: "streamer", source: "transcode", message: "Transcode queue is full" },
];

/** Replaces the browser WebSocket with a stub that answers the auth handshake with a log snapshot. */
function fakeSocket(snapshot: LiveLogEntry[]) {
	const original = window.WebSocket;
	class FakeSocket {
		onopen: (() => void) | null = null;
		onmessage: ((event: { data: string }) => void) | null = null;
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
	title: "Admin/DashboardPanel",
	component: DashboardPanel,
	tags: ["autodocs"],
	parameters: { layout: "fullscreen" },
	// The activity widget links to the `admin-activity` route, which the story router does not have.
	decorators: [
		(story) => ({
			components: { story },
			setup() {
				const router = useRouter();
				const removeRoute = router.addRoute({ name: "admin-activity", path: "/admin/activity", component: { render: () => null } });
				onBeforeUnmount(() => removeRoute());
			},
			template: '<div class="mx-auto w-[1200px]"><div id="admin-header-actions" class="flex justify-end"></div><story /></div>',
		}),
	],
	beforeEach: () => {
		mocked(getAdminOverview).mockResolvedValue(adminOverview);
		mocked(getPreferences).mockResolvedValue({} as Awaited<ReturnType<typeof getPreferences>>);
		mocked(updatePreferences).mockResolvedValue({} as Awaited<ReturnType<typeof updatePreferences>>);
		mocked(getIndexerStatus).mockResolvedValue(indexerStatus);
		mocked(getBackupStatus).mockResolvedValue(backupStatus);
		mocked(getUpdateStatus).mockResolvedValue(updateStatus);
		mocked(listMediaRequests).mockResolvedValue({ total: 31, counts: { pending: 5, approved: 12, available: 12, failed: 2 }, items: [] });
		mocked(listAdminUsers).mockResolvedValue(adminUsers);
		mocked(listStreamSessions).mockResolvedValue(streamSessions);
		mocked(getAccessToken).mockReturnValue("storybook-token");
		return fakeSocket(logs);
	},
} satisfies Meta<typeof DashboardPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Loading: Story = {
	beforeEach: () => {
		mocked(getAdminOverview).mockReturnValue(new Promise(() => undefined));
		mocked(getPreferences).mockReturnValue(new Promise(() => undefined));
	},
};
export const LoadError: Story = {
	beforeEach: () => {
		mocked(getAdminOverview).mockRejectedValue(new Error("Network error"));
	},
};
