import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { closeModalsByGroup } from "@kolirt/vue-modal";
import { createAgent } from "@ui-sdk/vue/agent";
import { expect, mocked, userEvent, waitFor, within } from "storybook/test";
import { saveUserWebhook } from "../../api/userWebhooks";
import { modalStory } from "../../storybook/modalStory";
import UserWebhookModal from "./UserWebhookModal.vue";

const meta = {
	title: "Settings/UserWebhookModal",
	component: UserWebhookModal,
	parameters: { layout: "fullscreen" },
	render: (args) => modalStory(UserWebhookModal, args)(),
	beforeEach: () => {
		mocked(saveUserWebhook).mockImplementation(async (hook) => ({ id: "hook-1", ...hook }));
		return async () => { await closeModalsByGroup("default", { instantExit: true }); };
	},
} satisfies Meta<typeof UserWebhookModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FormInteraction: Story = {
	play: async () => {
		const page = within(document.body);
		const name = await page.findByRole("textbox", { name: "Name" });
		const url = page.getByRole("textbox", { name: "Destination URL" });
		const enabled = page.getByRole("checkbox", { name: "Enabled" });
		await expect(name).toBeRequired();
		await expect(url).toBeRequired();
		await expect(url).toHaveAttribute("type", "url");
		enabled.focus();
		await userEvent.keyboard(" ");
		await expect(enabled).not.toBeChecked();
		const agent = createAgent();
		await userEvent.type(name, "Playback");
		await userEvent.type(url, "https://example.com/hook");
		await userEvent.click(enabled);
		await expect(enabled).toBeChecked();
		await expect(agent.snapshot()).toEqual([]);
		const blocked = await agent.act({ steps: [{ ref: "Create webhook", action: "press" }] });
		await expect(blocked.ok).toBe(false);
		await expect(mocked(saveUserWebhook)).not.toHaveBeenCalled();
		await userEvent.click(page.getByRole("button", { name: "Create webhook" }));
		await waitFor(() => expect(mocked(saveUserWebhook)).toHaveBeenCalledWith({ name: "Playback", url: "https://example.com/hook", enabled: true }, undefined));
		await waitFor(() => expect(page.queryByRole("dialog")).not.toBeInTheDocument());
	},
};
