import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { mocked } from "storybook/test";
import { listApiKeys, listDevices, type AdminDevice, type ApiKeyInfo } from "../../api";
import DevicesPanel from "./DevicesPanel.vue";

const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();

const devices: AdminDevice[] = [
	{ id: "d1", device: "Chrome on macOS", app: "Flixer Web", user: { id: "u1", username: "alice", displayName: "Alice Admin" }, ipAddress: "192.168.1.20", createdAt: minutesAgo(60 * 24 * 30), lastSeenAt: minutesAgo(1), current: true },
	{ id: "d2", device: "Living room TV", app: "Flixer TV", user: { id: "u2", username: "bob", displayName: "Bob" }, ipAddress: "192.168.1.31", createdAt: minutesAgo(60 * 24 * 90), lastSeenAt: minutesAgo(180), current: false },
	{ id: "d3", device: "Pixel 9", app: "Flixer Android", user: { id: "u2", username: "bob", displayName: "Bob" }, ipAddress: null, createdAt: minutesAgo(60 * 24 * 7), lastSeenAt: minutesAgo(60 * 30), current: false },
];

const keys: ApiKeyInfo[] = [
	{ id: "k1", name: "Home Assistant", prefix: "flx_a1b2", owner: { id: "u1", username: "alice", displayName: "Alice Admin" }, createdAt: minutesAgo(60 * 24 * 20), lastUsedAt: minutesAgo(15) },
	{ id: "k2", name: "Backup script", prefix: "flx_c3d4", owner: { id: "u1", username: "alice", displayName: "Alice Admin" }, createdAt: minutesAgo(60 * 24 * 60), lastUsedAt: null },
];

const meta = {
	title: "Admin/DevicesPanel",
	component: DevicesPanel,
	tags: ["autodocs"],
	argTypes: { part: { control: "inline-radio", options: [undefined, "devices", "keys"] } },
	render: (args) => ({ components: { DevicesPanel }, setup: () => ({ args }), template: '<div class="max-w-4xl"><DevicesPanel v-bind="args" /></div>' }),
	beforeEach: () => {
		mocked(listDevices).mockResolvedValue(devices);
		mocked(listApiKeys).mockResolvedValue(keys);
	},
} satisfies Meta<typeof DevicesPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const DevicesOnly: Story = { args: { part: "devices" } };
export const KeysOnly: Story = { args: { part: "keys" } };
export const Empty: Story = {
	beforeEach: () => {
		mocked(listDevices).mockResolvedValue([]);
		mocked(listApiKeys).mockResolvedValue([]);
	},
};
export const LoadError: Story = {
	beforeEach: () => {
		mocked(listDevices).mockRejectedValue(new Error("Network error"));
		mocked(listApiKeys).mockRejectedValue(new Error("Network error"));
	},
};
