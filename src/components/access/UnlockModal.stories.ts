import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { closeModalsByGroup } from "@kolirt/vue-modal";
import { createAgent } from "@ui-sdk/vue/agent";
import { expect, mocked, userEvent, waitFor, within } from "storybook/test";
import { unlockAccess } from "../../api";
import { modalStory } from "../../storybook/modalStory";
import UnlockModal from "./UnlockModal.vue";

const meta = {
	title: "Access/UnlockModal",
	component: UnlockModal,
	tags: ["autodocs"],
	parameters: { layout: "fullscreen" },
	render: () => modalStory(UnlockModal)(),
	beforeEach: () => async () => { await closeModalsByGroup("default", { instantExit: true }); },
} satisfies Meta<typeof UnlockModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WrongPin: Story = {
	beforeEach: () => {
		mocked(unlockAccess).mockRejectedValue(new Error("Wrong PIN"));
	},
	play: async () => {
		const page = within(await within(document.body).findByRole("dialog"));
		const pin = page.getByLabelText("PIN");
		const unlock = page.getByRole("button", { name: "Unlock" });
		await expect(unlock).toBeDisabled();
		await userEvent.type(pin, "123456");
		const agent = createAgent();
		await expect(agent.snapshot()).toEqual([]);
		const denied = await agent.act({ steps: [{ ref: "Unlock", action: "press" }] });
		await expect(denied.ok).toBe(false);
		await expect(unlockAccess).not.toHaveBeenCalled();
		await userEvent.keyboard("{Enter}");
		await waitFor(() => expect(unlockAccess).toHaveBeenCalledWith("123456"));
		await waitFor(() => expect(page.getByRole("alert")).toBeVisible());
		await expect(pin).toHaveValue("");
		await userEvent.click(page.getByRole("button", { name: "Cancel" }));
	},
};
