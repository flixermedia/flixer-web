import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { closeModalsByGroup } from "@kolirt/vue-modal";
import { createAgent } from "@ui-sdk/vue/agent";
import { expect, mocked, userEvent, waitFor, within } from "storybook/test";
import { createFriendInvite } from "../../api";
import { modalStory } from "../../storybook/modalStory";
import FriendInviteModal from "./FriendInviteModal.vue";

const meta = {
	title: "Social/FriendInviteModal",
	component: FriendInviteModal,
	tags: ["autodocs"],
	parameters: { layout: "fullscreen" },
	args: { username: "alex" },
	beforeEach: () => {
		mocked(createFriendInvite).mockResolvedValue({ token: "abc123def456", expiresAt: null });
		return async () => { await closeModalsByGroup("default", { instantExit: true }); };
	},
	render: (args) => modalStory(FriendInviteModal, args)(),
} satisfies Meta<typeof FriendInviteModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const CreateExpiringInvite: Story = {
	play: async () => {
		const page = within(document.body);
		const dialog = within(await page.findByRole("dialog", { name: "Share a Friend Invite" }));
		const button = dialog.getByRole("button", { name: "Create Invite Link" });
		const agent = createAgent();
		const denied = await agent.act({ steps: [{ ref: "Create Invite Link", action: "press" }] });
		expect(denied.ok).toBe(false);
		expect(createFriendInvite).not.toHaveBeenCalled();
		const expires = dialog.getByRole("radio", { name: /Expire after a duration/ });
		await userEvent.click(expires);
		await expect(expires).toBeChecked();
		const duration = dialog.getByRole("spinbutton", { name: "Expiration duration" });
		await userEvent.clear(duration);
		await userEvent.type(duration, "2");
		await userEvent.selectOptions(dialog.getByRole("combobox", { name: "Expiration unit" }), "days");
		await userEvent.click(button);
		await waitFor(() => expect(createFriendInvite).toHaveBeenCalledWith("alex", { mode: "expires", expiresInHours: 48 }));
		await expect(await dialog.findByLabelText("Friend invite link")).toHaveValue(`${window.location.origin}/friend-invite/abc123def456`);
		await expect(JSON.stringify(await agent.snapshot())).not.toContain("abc123def456");
		await userEvent.click(dialog.getByRole("button", { name: "Close" }));
		await waitFor(() => expect(page.queryByRole("dialog")).not.toBeInTheDocument());
	},
};
export const CreationFails: Story = {
	beforeEach: () => {
		mocked(createFriendInvite).mockRejectedValue(new Error("Failed"));
	},
};
