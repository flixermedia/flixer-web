import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, fn, userEvent } from "storybook/test";
import { useParty } from "../../composables/useParty";
import { partyFixture } from "../../storybook/fixturesSession";
import PartyChat from "./PartyChat.vue";

function chatStory(withMessages: boolean) {
	return (args: { onClose?: () => void }) => ({
		components: { PartyChat },
		setup() {
			const party = useParty();
			party.party.value = partyFixture;
			party.messages.value = withMessages
				? [
						{ id: "1", from: partyFixture.members[1], text: "Starting in a minute!", at: Date.now() - 120_000 },
						{ id: "2", from: partyFixture.members[2], text: "Grabbing popcorn 🍿", at: Date.now() - 60_000 },
						{ id: "3", from: partyFixture.members[0], text: "Ready when you are.", at: Date.now() },
					]
				: [];
			return { args };
		},
		template: '<div class="h-96 w-72 rounded border border-flixer-border bg-flixer-surface"><PartyChat v-bind="args" /></div>',
	});
}

const meta = {
	title: "Party/PartyChat",
	component: PartyChat,
	tags: ["autodocs"],
	args: { onClose: fn() },
} satisfies Meta<typeof PartyChat>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Conversation: Story = {
	render: chatStory(true),
	play: async ({ args, canvas }) => {
		const input = canvas.getByRole("textbox", { name: "Say Something…" });
		await expect(input).toHaveFocus();
		const send = canvas.getByRole("button", { name: "Send" });
		await expect(send).toBeDisabled();
		await userEvent.type(input, "Hello everyone");
		await userEvent.keyboard("{Enter}");
		await expect(input).toHaveValue("");
		await expect(send).toBeDisabled();
		await userEvent.click(canvas.getByRole("button", { name: "Close Chat" }));
		await expect(args.onClose).toHaveBeenCalledOnce();
	},
};
export const Empty: Story = { render: chatStory(false) };
