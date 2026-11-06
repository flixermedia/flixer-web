import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { fn, mocked } from "storybook/test";
import { getPluginSettings, updatePluginSettings } from "../../api";
import { pluginSettingsFixture } from "../../storybook/fixturesPlugins";
import PluginSettingsForm from "./PluginSettingsForm.vue";

const meta = {
	title: "Admin/PluginSettingsForm",
	component: PluginSettingsForm,
	tags: ["autodocs"],
	parameters: { layout: "padded" },
	args: { pluginId: "flixer-lyrics", title: "Lyrics Fetcher", description: "Settings for the lyrics plugin.", onClose: fn() },
	beforeEach: () => {
		mocked(getPluginSettings).mockResolvedValue(pluginSettingsFixture);
		mocked(updatePluginSettings).mockResolvedValue(pluginSettingsFixture);
	},
} satisfies Meta<typeof PluginSettingsForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Closable: Story = { args: { closable: true } };
export const NoSettings: Story = {
	beforeEach: () => {
		mocked(getPluginSettings).mockResolvedValue({ schema: null, values: {}, secretFields: [] });
	},
};
export const LoadError: Story = {
	beforeEach: () => {
		mocked(getPluginSettings).mockRejectedValue(new Error("Plugin is not running"));
	},
};
