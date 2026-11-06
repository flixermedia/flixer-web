import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { mocked } from "storybook/test";
import { deleteMediaLibrary, getIndexerStatus, getNetworkShareSupport, listMediaLibraries, listNetworkShares, queueLibrarySegments, scanMediaLibrary, syncLibraryThemes } from "../../api";
import { idleIndexerStatus, scanningIndexerStatus } from "../../storybook/fixturesLeft00";
import { mediaLibraries, networkShares } from "../../storybook/fixturesMediaAdmin";
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
		mocked(syncLibraryThemes).mockResolvedValue(undefined as never);
		mocked(queueLibrarySegments).mockResolvedValue(undefined as never);
		mocked(deleteMediaLibrary).mockResolvedValue(undefined as never);
	},
} satisfies Meta<typeof LibrariesPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
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
