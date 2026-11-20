import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { closeModalsByGroup, ModalClosedError, openModal } from "@kolirt/vue-modal";
import { createAgent } from "@ui-sdk/vue/agent";
import { expect, mocked, userEvent, waitFor, within } from "storybook/test";
import { ref } from "vue";
import { createPlaylist, updatePlaylist, type PlaylistSummary } from "../api";
import { modalStory } from "../storybook/modalStory";
import PlaylistEditorModal from "./PlaylistEditorModal.vue";

const playlist = { id: "pl-1", name: "Road trip", description: "Songs for the drive", isPublic: false, trackCount: 12 } as unknown as PlaylistSummary;

const meta = {
	title: "Social/PlaylistEditorModal",
	component: PlaylistEditorModal,
	tags: ["autodocs"],
	parameters: { layout: "fullscreen" },
	beforeEach: () => {
		mocked(createPlaylist).mockClear();
		mocked(updatePlaylist).mockClear();
		mocked(createPlaylist).mockResolvedValue(playlist);
		mocked(updatePlaylist).mockResolvedValue(playlist);
		return async () => { await closeModalsByGroup("default", { instantExit: true }); };
	},
	render: (args) => modalStory(PlaylistEditorModal, args)(),
} satisfies Meta<typeof PlaylistEditorModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Create: Story = {};
export const Edit: Story = { args: { playlist } };
export const SaveFails: Story = {
	args: { playlist },
	beforeEach: () => {
		mocked(updatePlaylist).mockRejectedValue(new Error("Server error"));
	},
};

export const CreateInteraction: Story = {
	play: async () => {
		const page = within(document.body);
		const name = await page.findByRole("textbox", { name: "Playlist Name" });
		const description = page.getByRole("textbox", { name: "Description" });
		const checkbox = page.getByRole("checkbox", { name: "Make this playlist public" });
		const save = page.getByRole("button", { name: "Save Changes" });
		await expect(name).toBeRequired();
		await expect(name).toHaveAttribute("maxlength", "100");
		await expect(description).toHaveAttribute("maxlength", "500");
		await expect(save).toBeDisabled();
		await userEvent.type(name, "   ");
		await expect(save).toBeDisabled();
		checkbox.focus();
		await userEvent.keyboard(" ");
		await expect(checkbox).not.toBeChecked();
		const agent = createAgent();
		const entries = agent.snapshot().filter((entry) => !entry.offPage && entry.component !== "more");
		for (const label of ["Playlist Name", "Description", "Make this playlist public", "Cancel", "Save Changes"]) {
			await expect(entries.some((entry) => entry.label === label), label).toBe(true);
		}
		const result = await agent.act({ steps: [
			{ ref: "Playlist Name", action: "setValue", args: ["  Road trip  "] },
			{ ref: "Description", action: "setValue", args: ["  Songs for the drive  "] },
			{ ref: "Make this playlist public", action: "setChecked", args: [true] },
		] });
		await expect(result.ok, result.error?.message).toBe(true);
		await expect(name).toHaveValue("  Road trip  ");
		await expect(description).toHaveValue("  Songs for the drive  ");
		await expect(checkbox).toBeChecked();
		const submit = await agent.act({ steps: [{ ref: "Save Changes", action: "press" }] });
		await expect(submit.ok, submit.error?.message).toBe(true);
		await waitFor(() => expect(mocked(createPlaylist)).toHaveBeenCalledWith({ name: "Road trip", description: "Songs for the drive", isPublic: true }));
		await waitFor(() => expect(page.queryByRole("dialog")).not.toBeInTheDocument());
	},
};

export const EditInteraction: Story = {
	args: { playlist },
	play: async () => {
		const page = within(document.body);
		const name = await page.findByRole("textbox", { name: "Playlist Name" });
		const description = page.getByRole("textbox", { name: "Description" });
		const checkbox = page.getByRole("checkbox", { name: "Make this playlist public" });
		await expect(name).toHaveValue("Road trip");
		await expect(description).toHaveValue("Songs for the drive");
		await expect(checkbox).not.toBeChecked();
		await userEvent.clear(name);
		await userEvent.type(name, "  New title  ");
		await userEvent.clear(description);
		await userEvent.click(page.getByText("Make this playlist public"));
		await expect(checkbox).toBeChecked();
		await userEvent.click(page.getByRole("button", { name: "Save Changes" }));
		await waitFor(() => expect(mocked(updatePlaylist)).toHaveBeenCalledWith("pl-1", { name: "New title", description: "", isPublic: true }));
		await waitFor(() => expect(page.queryByRole("dialog")).not.toBeInTheDocument());
	},
};

export const FailureInteraction: Story = {
	args: { playlist },
	beforeEach: () => { mocked(updatePlaylist).mockRejectedValue(new Error("Server error")); },
	play: async () => {
		const page = within(document.body);
		await userEvent.click(await page.findByRole("button", { name: "Save Changes" }));
		await expect(await page.findByRole("alert")).toHaveTextContent("Could not save this change. Please try again.");
		await expect(page.getByRole("button", { name: "Save Changes" })).toBeEnabled();
	},
};

export const Cancellation: Story = {
	render: () => ({
		setup() {
			const result = ref("waiting");
			const open = async () => {
				try {
					await openModal<PlaylistSummary>(PlaylistEditorModal);
					result.value = "saved";
				} catch (error) {
					if (!(error instanceof ModalClosedError)) throw error;
					result.value = "cancelled";
				}
			};
			return { open, result };
		},
		template: '<button type="button" @click="open">Open playlist editor</button><output data-testid="result">{{ result }}</output>',
	}),
	play: async ({ canvas }) => {
		const trigger = canvas.getByRole("button", { name: "Open playlist editor" });
		await userEvent.click(trigger);
		await userEvent.click(await within(document.body).findByRole("button", { name: "Cancel" }));
		await waitFor(() => expect(canvas.getByTestId("result")).toHaveTextContent("cancelled"));
		await waitFor(() => expect(trigger).toHaveFocus());
		await expect(mocked(createPlaylist)).not.toHaveBeenCalled();
	},
};
