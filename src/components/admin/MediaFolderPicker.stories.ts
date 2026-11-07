import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, mocked, userEvent, waitFor, within } from "storybook/test";
import { browseMediaFolders, listMediaLibraries, listMediaRoots } from "../../api";
import { mediaFolders, mediaLibraries, mediaRoots } from "../../storybook/fixturesMediaAdmin";
import { modalStory } from "../../storybook/modalStory";
import MediaFolderPicker from "./MediaFolderPicker.vue";

const meta = {
	title: "Admin/MediaFolderPicker",
	component: MediaFolderPicker,
	tags: ["autodocs"],
	parameters: { layout: "fullscreen" },
	render: (args) => modalStory(MediaFolderPicker, args)(),
	beforeEach: () => {
		mocked(listMediaRoots).mockResolvedValue(mediaRoots);
		mocked(listMediaLibraries).mockResolvedValue(mediaLibraries);
		mocked(browseMediaFolders).mockImplementation(async (_rootId, path) => ({ path: path ?? "", directories: mediaFolders[path ?? ""] ?? [] }) as Awaited<ReturnType<typeof browseMediaFolders>>);
	},
} satisfies Meta<typeof MediaFolderPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const SingleRoot: Story = {
	beforeEach: () => {
		mocked(listMediaRoots).mockResolvedValue([mediaRoots[0]!]);
	},
};
export const NoRoots: Story = {
	beforeEach: () => {
		mocked(listMediaRoots).mockResolvedValue([]);
	},
};
export const BrowseError: Story = {
	beforeEach: () => {
		mocked(listMediaRoots).mockResolvedValue([mediaRoots[0]!]);
		mocked(browseMediaFolders).mockRejectedValue(new Error("Permission denied"));
	},
};

export const ImportedIndicators: Story = {
	args: {},
	play: async ({ canvasElement }) => {
		const modal = within(canvasElement.ownerDocument.body);
		await userEvent.click(await modal.findByRole("button", { name: /Media \/media/ }));
		await modal.findByText("Movies", { selector: "button" });
		expect(modal.getByText("In library: Movies")).toBeVisible();
		expect(modal.getByText("In library: TV Shows")).toBeVisible();
		await userEvent.click(modal.getByRole("button", { name: "Movies" }));
		expect(await modal.findByText("Arrival (2016)", { selector: "button" })).toBeVisible();
		expect(modal.getAllByText("In library: Movies").length).toBeGreaterThan(1);
	},
};

export const ScopedScan: Story = {
	args: { library: mediaLibraries[0]! },
	play: async ({ canvasElement }) => {
		const modal = within(canvasElement.ownerDocument.body);
		await waitFor(() => expect(modal.getByRole("button", { name: "Scan Current Folder" })).toBeEnabled());
		await userEvent.click(modal.getByLabelText("Select Arrival (2016)"));
		expect(modal.getByRole("button", { name: "Scan Selected Folders" })).toBeEnabled();
		await userEvent.click(modal.getByLabelText("Select Arrival (2016)"));
		await userEvent.click(modal.getByRole("button", { name: "Up" }));
		expect(modal.getByLabelText("Select TV Shows")).toBeDisabled();
		expect(modal.getByRole("button", { name: "Scan Current Folder" })).toBeDisabled();
	},
};
