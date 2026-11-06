import type { Meta, StoryObj } from "@storybook/vue3-vite";
import type { AxiosAdapter, AxiosResponse } from "axios";
import { mocked } from "storybook/test";
import { api, getDatabaseTransferStatus, restoreDatabaseSourceWrites, startDatabaseTransfer, type DatabaseTransferStatus } from "../../api";
import ConnectionsSection from "./ConnectionsSection.vue";

type Field = { source: "env" | "store" | "default" | "unset"; locked: boolean; set: boolean; value?: string; default?: string };

const field = (value: string, locked = false): Field => ({ source: locked ? "env" : "store", locked, set: true, value });

const config: Record<string, Field> = {
	databaseUrl: field("postgres://flixer@db:5432/flixer"),
	redisUrl: field("redis://redis:6379"),
	indexerUrl: field("http://indexer:8092"),
	streamerInternalUrl: field("http://streamer:8091"),
	streamerPublicUrl: { source: "unset", locked: false, set: false },
	meilisearchUrl: field("http://meilisearch:7700"),
	aiUrl: field("http://ai:8094", true),
};

const idleTransfer: DatabaseTransferStatus = { state: "idle", phase: "idle", message: "", sourceLocked: false, startedAt: null, finishedAt: null, currentDatabaseUrl: "postgres://flixer@db:5432/flixer" };

/** `setupApi` talks to the shared axios client directly, so its endpoints are answered by a fake adapter. */
function fakeSetupServer(fields: Record<string, Field>): AxiosAdapter {
	return async (request) => {
		const body = request.url?.includes("/setup/progress") ? { flow: "fresh", completedSteps: [], steps: [], adminExists: true, config: fields } : { ok: true, message: "Connection successful" };
		return { data: body, status: 200, statusText: "OK", headers: {}, config: request } as AxiosResponse;
	};
}

function useFakeSetupServer(fields: Record<string, Field>) {
	const original = api.defaults.adapter;
	api.defaults.adapter = fakeSetupServer(fields);
	return () => {
		api.defaults.adapter = original;
	};
}

const meta = {
	title: "Admin/ConnectionsSection",
	component: ConnectionsSection,
	tags: ["autodocs"],
	parameters: { layout: "padded" },
	decorators: [() => ({ template: '<div class="w-[720px]"><story /></div>' })],
	beforeEach: () => {
		mocked(getDatabaseTransferStatus).mockResolvedValue(idleTransfer);
		mocked(startDatabaseTransfer).mockResolvedValue(idleTransfer);
		mocked(restoreDatabaseSourceWrites).mockResolvedValue(idleTransfer);
		return useFakeSetupServer(config);
	},
} satisfies Meta<typeof ConnectionsSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const NothingConfigured: Story = {
	beforeEach: () => useFakeSetupServer({}),
};
export const TransferRunning: Story = {
	beforeEach: () => {
		mocked(getDatabaseTransferStatus).mockResolvedValue({ ...idleTransfer, state: "running", phase: "copying", message: "Copying tables", sourceLocked: true, startedAt: new Date().toISOString() });
	},
};
export const TransferFailed: Story = {
	beforeEach: () => {
		mocked(getDatabaseTransferStatus).mockResolvedValue({ ...idleTransfer, state: "failed", phase: "copying", message: "Could not connect to the target database", sourceLocked: true, startedAt: new Date().toISOString(), finishedAt: new Date().toISOString() });
	},
};
