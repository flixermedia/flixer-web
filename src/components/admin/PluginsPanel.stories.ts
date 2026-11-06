import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { mocked } from "storybook/test";
import { discoverPlugins, listPluginInstallations, listPluginRepositories, listPluginUpdateHistory, listPluginPages } from "../../api";
import { pluginCatalogFixture, pluginHistoryFixture, pluginInstallationsFixture, pluginRepositoriesFixture } from "../../storybook/fixturesPlugins";
import PluginsPanel from "./PluginsPanel.vue";

const meta = {
	title: "Admin/PluginsPanel",
	component: PluginsPanel,
	tags: ["autodocs"],
	parameters: { layout: "padded" },
} satisfies Meta<typeof PluginsPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	beforeEach: () => {
		mocked(listPluginInstallations).mockResolvedValue(pluginInstallationsFixture);
		mocked(listPluginRepositories).mockResolvedValue(pluginRepositoriesFixture);
		mocked(discoverPlugins).mockResolvedValue(pluginCatalogFixture);
		mocked(listPluginUpdateHistory).mockResolvedValue(pluginHistoryFixture);
		mocked(listPluginPages).mockResolvedValue([]);
	},
};

export const Empty: Story = {
	beforeEach: () => {
		mocked(listPluginInstallations).mockResolvedValue([]);
		mocked(listPluginRepositories).mockResolvedValue([]);
		mocked(discoverPlugins).mockResolvedValue([]);
	},
};

export const LoadError: Story = {
	beforeEach: () => {
		mocked(listPluginInstallations).mockRejectedValue(new Error("Could not reach the server"));
		mocked(listPluginRepositories).mockRejectedValue(new Error("Could not reach the server"));
		mocked(discoverPlugins).mockResolvedValue([]);
	},
};
