import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { mocked } from "storybook/test";
import { listSettings, type ServerSetting } from "../../api";
import IndexerProvidersSection from "./IndexerProvidersSection.vue";

const stamp = "2026-10-01T10:00:00.000Z";
const settings: ServerSetting[] = [
	{ key: "indexer_language", value: "en", isPublic: false, updatedAt: stamp },
	{ key: "indexer_providers", value: { tmdb: { enabled: true, apiKey: "********" }, tvdb: { enabled: false }, musicbrainz: { enabled: true }, anilist: { enabled: true } }, isPublic: false, updatedAt: stamp },
];

const meta = {
	title: "Admin/IndexerProvidersSection",
	component: IndexerProvidersSection,
	tags: ["autodocs"],
	render: () => ({ components: { IndexerProvidersSection }, template: '<div class="max-w-3xl"><IndexerProvidersSection /></div>' }),
} satisfies Meta<typeof IndexerProvidersSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Configured: Story = { beforeEach: () => void mocked(listSettings).mockResolvedValue(settings) };
export const Defaults: Story = { beforeEach: () => void mocked(listSettings).mockResolvedValue([]) };
export const LoadError: Story = { beforeEach: () => void mocked(listSettings).mockRejectedValue(new Error("Network error")) };
