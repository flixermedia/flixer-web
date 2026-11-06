import type { Meta, StoryObj } from "@storybook/vue3-vite";
import type { AxiosAdapter, AxiosResponse } from "axios";
import { api } from "../../api";
import NetworkingSection from "./NetworkingSection.vue";

type Field = { source: "env" | "store" | "default" | "unset"; locked: boolean; set: boolean; value?: string };

const field = (value: string, locked = false): Field => ({ source: locked ? "env" : "store", locked, set: true, value });

const config: Record<string, Field> = {
	publicUrl: field("https://flixer.example.com/api"),
	appUrl: field("https://flixer.example.com"),
	passkeyRpId: field("flixer.example.com"),
	passkeyOrigins: field("https://flixer.example.com"),
};

/** `setupApi` talks to the shared axios client directly, so its endpoints are answered by a fake adapter. */
function useFakeSetupServer(fields: Record<string, Field>, mode: "ok" | "error" | "pending" = "ok") {
	const original = api.defaults.adapter;
	const adapter: AxiosAdapter = async (request) => {
		if (mode === "pending") return new Promise<AxiosResponse>(() => undefined);
		if (mode === "error") throw new Error("Network error");
		const data = request.url?.includes("/setup/progress") ? { flow: "fresh", completedSteps: [], steps: [], adminExists: true, config: fields } : { ok: true };
		return { data, status: 200, statusText: "OK", headers: {}, config: request } as AxiosResponse;
	};
	api.defaults.adapter = adapter;
	return () => {
		api.defaults.adapter = original;
	};
}

const meta = {
	title: "Admin/NetworkingSection",
	component: NetworkingSection,
	tags: ["autodocs"],
	parameters: { layout: "padded" },
	decorators: [() => ({ template: '<div class="w-[720px]"><story /></div>' })],
} satisfies Meta<typeof NetworkingSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { beforeEach: () => useFakeSetupServer(config) };
export const EnvLocked: Story = { beforeEach: () => useFakeSetupServer({ ...config, publicUrl: field("https://flixer.example.com/api", true), appUrl: field("https://flixer.example.com", true) }) };
export const Unconfigured: Story = { beforeEach: () => useFakeSetupServer({}) };
export const Loading: Story = { beforeEach: () => useFakeSetupServer(config, "pending") };
export const LoadError: Story = { beforeEach: () => useFakeSetupServer(config, "error") };
