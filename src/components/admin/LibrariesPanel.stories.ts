import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, mocked, userEvent, waitFor, within } from "storybook/test";
import { browseMediaFolders, deleteMediaLibrary, getIndexerStatus, getNetworkShareSupport, listMediaLibraries, listMediaRoots, listNetworkShares, queueLibrarySegments, scanLibraryFolders, scanMediaLibrary, syncLibraryThemes } from "../../api";
import { idleIndexerStatus, scanningIndexerStatus } from "../../storybook/fixturesLeft00";
import { mediaFolders, mediaLibraries, mediaRoots, networkShares } from "../../storybook/fixturesMediaAdmin";
import LibrariesPanel from "./LibrariesPanel.vue";

const meta = {
	title: "Admin/LibrariesPanel",
	component: LibrariesPanel,
	tags: ["autodocs"],
	parameters: { layout: "padded" },
	decorators: [() => ({ template: '<div class="w-[960px]"><story /></div>' })],
	beforeEach: () => {
		mocked(listMediaLibraries).mockResolvedValue(mediaLibraries);
		mocked(getIndexerStatus).mockResolvedValue(idleIndexerStatus);
		mocked(listNetworkShares).mockResolvedValue(networkShares);
		mocked(getNetworkShareSupport).mockResolvedValue({ supported: true } as Awaited<ReturnType<typeof getNetworkShareSupport>>);
		mocked(scanMediaLibrary).mockResolvedValue(undefined as never);
		mocked(scanLibraryFolders).mockResolvedValue({ queued: true, alreadyQueued: false });
		mocked(listMediaRoots).mockResolvedValue(mediaRoots);
		mocked(browseMediaFolders).mockImplementation(async (rootId, path) => ({ rootId, path, directories: mediaFolders[path] ?? [] }));
		mocked(syncLibraryThemes).mockResolvedValue(undefined as never);
		mocked(queueLibrarySegments).mockResolvedValue(undefined as never);
		mocked(deleteMediaLibrary).mockResolvedValue(undefined as never);
	},
} satisfies Meta<typeof LibrariesPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const FolderScan: Story = {
	play: async ({ canvas, canvasElement }) => {
		await canvas.findAllByRole("button", { name: "Scan Folders" });
		await userEvent.click(canvas.getAllByRole("button", { name: "Scan Folders" })[0]!);
		const modal = within(canvasElement.ownerDocument.body);
		await userEvent.click(await modal.findByLabelText("Select Arrival (2016)"));
		await userEvent.click(modal.getByRole("button", { name: "Scan Selected Folders" }));
		await waitFor(() => expect(scanLibraryFolders).toHaveBeenCalledWith("lib-movies", [{ rootId: "root-media", path: "Movies/Arrival (2016)" }]));
	},
};
export const Scanning: Story = {
	beforeEach: () => {
		mocked(getIndexerStatus).mockResolvedValue(scanningIndexerStatus);
	},
};
export const IndexerOffline: Story = {
	beforeEach: () => {
		mocked(getIndexerStatus).mockResolvedValue({ ...idleIndexerStatus, reachable: false });
	},
};
export const Empty: Story = {
	beforeEach: () => {
		mocked(listMediaLibraries).mockResolvedValue([]);
		mocked(listNetworkShares).mockResolvedValue([]);
	},
};
export const Loading: Story = {
	beforeEach: () => {
		mocked(listMediaLibraries).mockReturnValue(new Promise(() => undefined));
	},
};
export const LoadError: Story = {
	beforeEach: () => {
		mocked(listMediaLibraries).mockRejectedValue(new Error("Network error"));
	},
};
