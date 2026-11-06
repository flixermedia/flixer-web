import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { mocked } from "storybook/test";
import { listIndexerTasks, type IndexerTask } from "../../api";
import IndexerTasksSection from "./IndexerTasksSection.vue";

const failedTasks: IndexerTask[] = [
	{ id: "t1", queue: "identify", type: "identify:movie", state: "archived", retried: 5, maxRetry: 5, lastError: "TMDB returned 429 Too Many Requests", lastFailedAt: "2026-11-05T19:12:00.000Z", libraryId: "lib-movies", libraryName: "Movies", itemType: "movie", path: "/media/movies/Arrival (2016)/Arrival.mkv" },
	{ id: "t2", queue: "identify", type: "identify:episode", state: "archived", retried: 3, maxRetry: 3, lastError: "No match found", lastFailedAt: "2026-11-05T18:40:00.000Z", libraryId: "lib-shows", libraryName: "TV Shows", itemType: "episode", path: "/media/shows/Severance/S01E01.mkv" },
];

const meta = {
	title: "Admin/IndexerTasksSection",
	component: IndexerTasksSection,
	tags: ["autodocs"],
	render: () => ({ components: { IndexerTasksSection }, template: '<div class="max-w-4xl"><IndexerTasksSection /></div>' }),
} satisfies Meta<typeof IndexerTasksSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FailedTasks: Story = { beforeEach: () => void mocked(listIndexerTasks).mockResolvedValue(failedTasks) };
export const Empty: Story = { beforeEach: () => void mocked(listIndexerTasks).mockResolvedValue([]) };
export const LoadError: Story = { beforeEach: () => void mocked(listIndexerTasks).mockRejectedValue(new Error("Network error")) };
