import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, fn, mocked, waitFor } from "storybook/test";
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

export const EditSettings: Story = {
	play: async ({ canvas, userEvent }) => {
		const providers = await canvas.findByRole("textbox", { name: /Providers/ });
		const syncedOnly = canvas.getByRole("checkbox", { name: "Synced lyrics only" });
		await expect(providers).toHaveValue("lrclib, musixmatch");
		await userEvent.clear(providers);
		await userEvent.type(providers, "  lrclib, , archive  ");
		await userEvent.click(canvas.getByText("Synced lyrics only"));
		await expect(syncedOnly).not.toBeChecked();
		await expect(canvas.getByRole("spinbutton", { name: "Max tracks per run" })).toHaveValue(100);
		await userEvent.click(canvas.getByRole("button", { name: /save/i }));
		await waitFor(() => expect(mocked(updatePluginSettings)).toHaveBeenCalledWith("flixer-lyrics", {
			values: { language: "en", maxPerRun: 100, syncedOnly: false, providers: ["lrclib", "archive"] },
			secrets: { apiKey: "" },
		}));
	},
};
