import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { mocked } from "storybook/test";
import { listSettings, type ServerSetting } from "../../api";
import IndexerSubtitlesSection from "./IndexerSubtitlesSection.vue";

const stored: ServerSetting = { key: "indexer_subtitles", value: { apiKey: "********", username: "flixer", password: "********", languages: ["en", "nl"], autoFetch: true }, isPublic: false, updatedAt: "2026-10-01T10:00:00.000Z" };

const meta = {
	title: "Admin/IndexerSubtitlesSection",
	component: IndexerSubtitlesSection,
	tags: ["autodocs"],
	render: () => ({ components: { IndexerSubtitlesSection }, template: '<div class="max-w-3xl"><IndexerSubtitlesSection /></div>' }),
} satisfies Meta<typeof IndexerSubtitlesSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Configured: Story = { beforeEach: () => void mocked(listSettings).mockResolvedValue([stored]) };
export const NotConfigured: Story = { beforeEach: () => void mocked(listSettings).mockResolvedValue([]) };
export const LoadError: Story = { beforeEach: () => void mocked(listSettings).mockRejectedValue(new Error("Network error")) };
