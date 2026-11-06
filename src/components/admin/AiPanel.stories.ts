import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { mocked } from "storybook/test";
import { forceRefreshAiRecommendations, getAiAdminStatus, getAiRecommendationCaches, retryAiModel, saveAiAdminConfiguration, type AiAdminStatus } from "../../api";
import AiPanel from "./AiPanel.vue";

const now = Date.now();
const readyStatus: AiAdminStatus = {
	configuration: { enabled: true, profile: "auto", allowDownloads: true, cacheRefreshIntervalMinutes: 10 },
	available: true,
	error: null,
	service: {
		enabled: true,
		requestedProfile: "auto",
		activeProfile: "mini",
		modelReady: true,
		loadingProfile: null,
		downloadState: "idle",
		fallbackReason: null,
		allowDownloads: true,
		availableMemoryBytes: 12 * 1024 ** 3,
		recommendationCache: { entries: 14, refreshesInProgress: 0, refreshIntervalMinutes: 10 },
	},
	events: [
		{ id: 1, timestamp: new Date(now - 180_000).toISOString(), level: "info", message: "Model mini loaded" },
		{ id: 2, timestamp: new Date(now - 90_000).toISOString(), level: "warning", message: "Low memory, reducing batch size" },
		{ id: 3, timestamp: new Date(now - 30_000).toISOString(), level: "error", message: "Recommendation refresh failed for carol" },
	],
	nextEventId: 4,
};

const meta = {
	title: "Admin/AiPanel",
	component: AiPanel,
	tags: ["autodocs"],
	parameters: { layout: "padded" },
	beforeEach: () => {
		mocked(getAiAdminStatus).mockResolvedValue(readyStatus);
		mocked(getAiRecommendationCaches).mockResolvedValue([
			{
				userId: "user-1",
				username: "alice",
				displayName: "Alice",
				lastRefreshAt: new Date(now - 600_000).toISOString(),
				entries: [{ key: "movies", items: [{ id: "m1", title: "Arrival", type: "movie", score: 0.92, reason: "Because you liked Interstellar" }] }],
			},
		]);
		mocked(saveAiAdminConfiguration).mockImplementation(async (configuration) => ({ applied: true, configuration }));
		mocked(retryAiModel).mockResolvedValue(undefined);
		mocked(forceRefreshAiRecommendations).mockResolvedValue({ items: [] });
	},
} satisfies Meta<typeof AiPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Ready: Story = {};
export const Disabled: Story = {
	beforeEach: () => {
		mocked(getAiAdminStatus).mockResolvedValue({ ...readyStatus, configuration: { ...readyStatus.configuration, enabled: false }, service: { ...readyStatus.service!, enabled: false, modelReady: false }, events: [] });
	},
};
export const LoadingModel: Story = {
	beforeEach: () => {
		mocked(getAiAdminStatus).mockResolvedValue({ ...readyStatus, service: { ...readyStatus.service!, modelReady: false, loadingProfile: "mini", downloadState: "downloading" } });
	},
};
export const Unavailable: Story = {
	beforeEach: () => {
		mocked(getAiAdminStatus).mockResolvedValue({ ...readyStatus, available: false, service: null, error: "AI service is not reachable", events: [] });
		mocked(getAiRecommendationCaches).mockResolvedValue([]);
	},
};
