import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { mocked } from "storybook/test";
import { getPluginSettings, listPluginInstallations, updatePluginSettings } from "../../api";
import { pluginInstallationsFixture, pluginSettingsFixture } from "../../storybook/fixturesPlugins";
import PluginSettingsPage from "./PluginSettingsPage.vue";

const meta = {
	title: "Admin/PluginSettingsPage",
	component: PluginSettingsPage,
	tags: ["autodocs"],
	parameters: { layout: "padded" },
	args: { pluginId: "flixer-lyrics" },
	beforeEach: () => {
		mocked(listPluginInstallations).mockResolvedValue(pluginInstallationsFixture);
		mocked(getPluginSettings).mockResolvedValue(pluginSettingsFixture);
		mocked(updatePluginSettings).mockResolvedValue(pluginSettingsFixture);
	},
} satisfies Meta<typeof PluginSettingsPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const UnknownPlugin: Story = { args: { pluginId: "missing-plugin" } };
