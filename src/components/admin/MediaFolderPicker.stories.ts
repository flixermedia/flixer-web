import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { createAgent } from "@ui-sdk/vue/agent";
import { closeAllModals, openModal } from "@kolirt/vue-modal";
import { expect, mocked, userEvent, waitFor, within } from "storybook/test";
import { onMounted, ref } from "vue";
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
	beforeEach: async () => {
		await closeAllModals({ ignoreGuard: true, instantExit: true });
		mocked(listMediaRoots).mockResolvedValue(mediaRoots);
		mocked(listMediaLibraries).mockResolvedValue(mediaLibraries);
		mocked(browseMediaFolders).mockImplementation(async (_rootId, path) => ({ path: path ?? "", directories: mediaFolders[path ?? ""] ?? [] }) as Awaited<ReturnType<typeof browseMediaFolders>>);
		return async () => { await closeAllModals({ ignoreGuard: true, instantExit: true }); };
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
		await waitFor(() => expect(modal.getByText("In library: Movies")).toBeVisible());
		await waitFor(() => expect(modal.getByText("In library: TV Shows")).toBeVisible());
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

export const SelectAndConfirm: Story = {
	render: () => ({
		setup() {
			const result = ref("");
			onMounted(() => {
				void openModal(MediaFolderPicker).then((value) => { result.value = JSON.stringify(value); }).catch(() => undefined);
			});
			return { result };
		},
		template: '<output data-testid="selection">{{ result }}</output>',
	}),
	play: async ({ canvasElement }) => {
		const modal = within(canvasElement.ownerDocument.body);
		await userEvent.click(await modal.findByRole("button", { name: /Media \/media/ }));
		await userEvent.click(await modal.findByRole("button", { name: "Movies" }));
		await userEvent.click(await modal.findByLabelText("Select Arrival (2016)"));
		const choose = modal.getByRole("button", { name: "Use Selected Folders" });
		choose.focus();
		await userEvent.keyboard("{Enter}");
		await waitFor(() => expect(modal.getByTestId("selection").textContent).toBe(JSON.stringify([{ rootId: "root-media", path: "Movies/Arrival (2016)", label: "Media / Movies / Arrival (2016)" }])));
	},
};

export const ScanRequiresApproval: Story = {
	args: { library: mediaLibraries[0]! },
	play: async ({ canvasElement }) => {
		const modal = within(canvasElement.ownerDocument.body);
		await waitFor(() => expect(modal.getByRole("button", { name: "Scan Current Folder" })).toBeEnabled());
		const result = await createAgent().act({ steps: [{ ref: "Scan Current Folder", action: "press" }] });
		expect(result.ok).toBe(false);
	},
};

export const NavigateAndCancel: Story = {
	beforeEach: () => {
		mocked(listMediaRoots).mockResolvedValue([mediaRoots[0]!]);
	},
	play: async ({ canvasElement }) => {
		const modal = within(canvasElement.ownerDocument.body);
		await userEvent.click(await modal.findByRole("button", { name: "Movies" }));
		await waitFor(() => expect(modal.getByRole("button", { name: "Up" })).toBeEnabled());
		const agent = createAgent();
		expect((await agent.act({ steps: [{ ref: "Up", action: "press" }] })).ok).toBe(true);
		await waitFor(() => expect(browseMediaFolders).toHaveBeenLastCalledWith("root-media", ""));
		const cancel = modal.getByRole("button", { name: "Cancel" });
		cancel.focus();
		await userEvent.keyboard("{Enter}");
		await waitFor(() => expect(modal.getByRole("dialog", { hidden: true })).toHaveAttribute("data-state", "closed"));
	},
};
