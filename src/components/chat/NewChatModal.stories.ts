import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { closeModalsByGroup } from "@kolirt/vue-modal";
import { createAgent } from "@ui-sdk/vue/agent";
import { expect, mocked, userEvent, waitFor, within } from "storybook/test";
import { getProfiles } from "../../api";
import { modalStory } from "../../storybook/modalStory";
import { profilesFixture } from "../../storybook/fixturesProfiles";
import NewChatModal from "./NewChatModal.vue";

const meta = {
	title: "Chat/NewChatModal",
	component: NewChatModal,
	tags: ["autodocs"],
	parameters: { layout: "fullscreen" },
	render: (args) => modalStory(NewChatModal, args)(),
	beforeEach: () => {
		mocked(getProfiles).mockResolvedValue({ profiles: profilesFixture });
		return async () => { await closeModalsByGroup("default", { instantExit: true }); };
	},
} satisfies Meta<typeof NewChatModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const AddPeople: Story = { args: { addTo: { id: "chat-1", usernames: ["sam"] } } };
export const NoPeople: Story = {
	beforeEach: () => {
		mocked(getProfiles).mockResolvedValue({ profiles: [] });
	},
};

export const GroupFields: Story = {
	play: async () => {
		const page = within(document.body);
		const direct = await page.findByRole("radio", { name: "Direct" });
		direct.focus();
		await userEvent.keyboard("{ArrowRight}");
		await expect(page.getByRole("radio", { name: "Group" })).toBeChecked();
		const name = page.getByRole("textbox", { name: "Group Name" });
		const search = page.getByRole("searchbox", { name: "Search People" });
		await expect(page.getByRole("button", { name: "Create Group" })).toBeDisabled();
		const agent = createAgent();
		const result = await agent.act({ steps: [
			{ ref: "Group Name", action: "setValue", args: ["Friends"] },
			{ ref: "Search People", action: "setValue", args: ["Sam"] },
		] });
		await expect(result.ok, result.error?.message).toBe(true);
		await expect(name).toHaveValue("Friends");
		await expect(search).toHaveValue("Sam");
		await waitFor(() => expect(mocked(getProfiles)).toHaveBeenCalledWith("Sam"));
		const dialog = page.getByRole("dialog");
		await userEvent.click(page.getByRole("button", { name: "Cancel" }));
		await waitFor(() => expect(dialog).toHaveAttribute("data-state", "closed"));
	},
};
