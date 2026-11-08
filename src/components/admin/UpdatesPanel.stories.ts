import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, mocked, within } from "storybook/test";
import { applyUpdates, getUpdateStatus, listSettings, updateSetting } from "../../api";
import { serverSettings } from "../../storybook/fixturesAdminAB";
import { updateStatus } from "../../storybook/fixturesRequestsOps";
import UpdatesPanel from "./UpdatesPanel.vue";

const meta = {
	title: "Admin/UpdatesPanel",
	component: UpdatesPanel,
	tags: ["autodocs"],
	parameters: { layout: "padded" },
	beforeEach: () => {
		mocked(getUpdateStatus).mockResolvedValue(updateStatus);
		mocked(listSettings).mockResolvedValue([{ ...serverSettings[0], key: "updates_check_enabled", value: true }]);
		mocked(updateSetting).mockResolvedValue(serverSettings[0]);
		mocked(applyUpdates).mockResolvedValue(updateStatus.run as never);
	},
} satisfies Meta<typeof UpdatesPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const UpdatesAvailable: Story = {
	play: async ({ canvas }) => {
		await expect(await canvas.findByRole("row", { name: /AI 1\.0\.0/ })).toBeVisible();
		await expect(canvas.getByRole("row", { name: /Logger 1\.0\.0/ })).toBeVisible();
	},
};
export const UpToDate: Story = {
	beforeEach: () => {
		mocked(getUpdateStatus).mockResolvedValue({ ...updateStatus, updatesAvailable: 0, components: updateStatus.components.map((component) => ({ ...component, latest: component.installed, updateAvailable: false })) });
	},
};
export const UpdaterUnreachable: Story = { beforeEach: () => void mocked(getUpdateStatus).mockResolvedValue({ ...updateStatus, updaterReachable: false, canApply: false }) };
export const ComponentVersionUnavailable: Story = {
	beforeEach: () => {
		mocked(getUpdateStatus).mockResolvedValue({
			...updateStatus,
			updaterMode: "development",
			canApply: false,
			components: updateStatus.components.map((component) => component.id === "streamer" || component.id === "web" ? { ...component, installed: null, reachable: false, updateAvailable: false } : component),
		});
	},
	play: async ({ canvas }) => {
		const row = await canvas.findByRole("row", { name: /Streamer/ });
		await expect(within(row).getByText("Version unavailable")).toBeVisible();
		const web = await canvas.findByRole("row", { name: /Flixer Web/ });
		await expect(within(web).getByText(/-dev$/)).toBeVisible();
		await expect(within(web).getByText("Development build")).toBeVisible();
		await expect(canvas.queryByText("The updater is not reachable. Check that the flixer-updater container is running.")).not.toBeInTheDocument();
		await expect(canvas.getByText(/This updater is running in development mode/)).toBeVisible();
	},
};
export const ReachableComponentsUpdaterOffline: Story = {
	beforeEach: () => void mocked(getUpdateStatus).mockResolvedValue({ ...updateStatus, updaterReachable: false }),
	play: async ({ canvas }) => {
		await expect(await canvas.findByText("The updater is not reachable. Check that the flixer-updater container is running.")).toBeVisible();
		await expect(canvas.queryByText("Version unavailable")).not.toBeInTheDocument();
	},
};
export const LatestVersionUnavailable: Story = {
	beforeEach: () => void mocked(getUpdateStatus).mockResolvedValue({
		...updateStatus,
		components: updateStatus.components.map((component) =>
			component.id === "ai" || component.id === "logger" ? { ...component, latest: null, updateAvailable: false } : component,
		),
	}),
	play: async ({ canvas }) => {
		for (const name of ["AI", "Logger"]) {
			const row = await canvas.findByRole("row", { name: new RegExp(`^${name} `) });
			const badge = within(row).getByText("Latest unavailable");
			await expect(badge).toBeVisible();
			await expect(badge).toHaveClass("bg-amber-500/20");
		}
	},
};
export const DevelopmentVersion: Story = {
	beforeEach: () => void mocked(getUpdateStatus).mockResolvedValue({
		...updateStatus,
		components: updateStatus.components.map((component) =>
			component.id === "indexer" ? { ...component, installed: "0.8.0-dev", latest: "0.8.0", updateAvailable: false } : component,
		),
	}),
	play: async ({ canvas }) => {
		const row = await canvas.findByRole("row", { name: /Indexer 0\.8\.0-dev/ });
		await expect(within(row).getByText("Development build")).toBeVisible();
		await expect(within(row).queryByText("Up to date")).not.toBeInTheDocument();
	},
};
export const Loading: Story = { beforeEach: () => void mocked(getUpdateStatus).mockReturnValue(new Promise(() => undefined)) };
export const LoadError: Story = { beforeEach: () => void mocked(getUpdateStatus).mockRejectedValue(new Error("Network error")) };
