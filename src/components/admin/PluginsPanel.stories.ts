import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, mocked, userEvent, waitFor, within } from "storybook/test";
import { discoverPlugins, installPlugin, listPluginInstallations, listPluginRepositories, listPluginUpdateHistory, listPluginPages, localPluginImportStatus, uninstallPlugin } from "../../api";
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

const versionedPlugin = {
	...pluginCatalogFixture[0]!,
	icon: undefined,
	banner: undefined,
	versions: ["1.9.0", "2.0.0", "2.1.0"].map((version) => ({ version, manifest: "manifest.json", package: "package.tar.gz", sha256: "0".repeat(64) })),
};
const installedPlugin = {
	...pluginInstallationsFixture[1]!,
	id: versionedPlugin.id,
	version: "2.0.0",
	manifest: { ...pluginInstallationsFixture[1]!.manifest, id: versionedPlugin.id, name: versionedPlugin.name },
};

export const SelectPluginVersion: Story = {
	beforeEach: () => {
		mocked(listPluginInstallations).mockResolvedValue([installedPlugin]);
		mocked(listPluginRepositories).mockResolvedValue(pluginRepositoriesFixture);
		mocked(discoverPlugins).mockResolvedValue([versionedPlugin]);
		mocked(localPluginImportStatus).mockResolvedValue(false);
		mocked(listPluginPages).mockResolvedValue([]);
		mocked(installPlugin).mockImplementation(async (_id, request) => {
			const updated = { ...installedPlugin, version: typeof request.version === "string" ? request.version : installedPlugin.version };
			mocked(listPluginInstallations).mockResolvedValue([updated]);
			return updated;
		});
		mocked(uninstallPlugin).mockImplementation(async () => {
			mocked(listPluginInstallations).mockResolvedValue([]);
		});
	},
	play: async ({ canvas, canvasElement }) => {
		const catalog = within(await canvas.findByRole("list", { name: "Discover plugins" }));
		const selector = await catalog.findByRole("combobox", { name: "Version for Extra Subtitles" });
		await expect(selector).toHaveValue("2.1.0");
		await expect(catalog.getByRole("button", { name: "Upgrade" })).toBeEnabled();
		await userEvent.selectOptions(await catalog.findByRole("combobox", { name: "Version for Extra Subtitles" }), "2.0.0");
		await expect(catalog.getByRole("button", { name: "Uninstall" })).toBeEnabled();
		await userEvent.selectOptions(selector, "1.9.0");
		await userEvent.click(catalog.getByRole("button", { name: "Downgrade" }));
		const dialog = within(canvasElement.ownerDocument.body);
		await waitFor(() => expect(dialog.getByText(/Existing settings and data may be incompatible/)).toBeVisible());
		await userEvent.click(dialog.getByRole("button", { name: "Confirm" }));
		await waitFor(() => expect(installPlugin).toHaveBeenCalledWith(versionedPlugin.id, expect.objectContaining({ version: "1.9.0", repositoryId: "repo-1" })));
		await userEvent.click(await catalog.findByRole("button", { name: "Uninstall" }));
		await waitFor(() => expect(dialog.getByText(/linked authentication accounts will be removed/)).toBeVisible());
		await userEvent.click(dialog.getByRole("button", { name: "Confirm" }));
		await waitFor(() => expect(uninstallPlugin).toHaveBeenCalledWith(versionedPlugin.id));
		await expect(await catalog.findByRole("button", { name: "Install" })).toBeVisible();
	},
};

export const InstallLatestPluginVersion: Story = {
	beforeEach: () => {
		mocked(listPluginInstallations).mockResolvedValue([]);
		mocked(listPluginRepositories).mockResolvedValue(pluginRepositoriesFixture);
		mocked(discoverPlugins).mockResolvedValue([versionedPlugin]);
		mocked(localPluginImportStatus).mockResolvedValue(false);
		mocked(listPluginPages).mockResolvedValue([]);
		mocked(installPlugin).mockResolvedValue(installedPlugin);
	},
	play: async ({ canvas, canvasElement }) => {
		const catalog = within(await canvas.findByRole("list", { name: "Discover plugins" }));
		const selector = await catalog.findByRole("combobox", { name: "Version for Extra Subtitles" });
		await expect(selector).toHaveValue("2.1.0");
		await expect(catalog.getAllByRole("button", { name: "Install" })).toHaveLength(1);
		await userEvent.selectOptions(selector, "1.9.0");
		await userEvent.click(catalog.getByRole("button", { name: "Install" }));
		const dialog = within(canvasElement.ownerDocument.body);
		await waitFor(() => expect(dialog.getByText(/Install Extra Subtitles 1\.9\.0/)).toBeVisible());
		await userEvent.click(dialog.getByRole("button", { name: "Confirm" }));
		await waitFor(() => expect(installPlugin).toHaveBeenCalledWith(versionedPlugin.id, expect.objectContaining({ version: "1.9.0", repositoryId: "repo-1" })));
	},
};

export const EnabledPluginVersion: Story = {
	beforeEach: () => {
		mocked(listPluginInstallations).mockResolvedValue([{ ...installedPlugin, enabled: true }]);
		mocked(listPluginRepositories).mockResolvedValue(pluginRepositoriesFixture);
		mocked(discoverPlugins).mockResolvedValue([versionedPlugin]);
		mocked(localPluginImportStatus).mockResolvedValue(false);
	},
	play: async ({ canvas }) => {
		const catalog = within(await canvas.findByRole("list", { name: "Discover plugins" }));
		const selector = await catalog.findByRole("combobox", { name: "Version for Extra Subtitles" });
		await expect(catalog.getByRole("button", { name: "Upgrade" })).toBeDisabled();
		await userEvent.selectOptions(selector, "2.0.0");
		await expect(catalog.getByRole("button", { name: "Uninstall" })).toBeDisabled();
	},
};
