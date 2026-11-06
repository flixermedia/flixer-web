import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { useChatUnread } from "../../composables/useChat";
import { useMailSummary } from "../../composables/useMailSummary";
import { mailMeFixture } from "../../storybook/fixturesSession";
import ChatButton from "./ChatButton.vue";

const buttonClass = "relative grid size-10 place-items-center rounded text-white/80 transition hover:bg-white/10 hover:text-white";

function unreadStory(unread: number, mailUnread: number) {
	return (args: { buttonClass: string }) => ({
		components: { ChatButton },
		setup() {
			useChatUnread().set(unread);
			useMailSummary().info.value = { ...mailMeFixture, unread: mailUnread };
			return { args };
		},
		template: '<ChatButton v-bind="args" />',
	});
}

const meta = {
	title: "Header/ChatButton",
	component: ChatButton,
	tags: ["autodocs"],
	args: { buttonClass },
} satisfies Meta<typeof ChatButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NoUnread: Story = { render: unreadStory(0, 0) };
export const Unread: Story = { render: unreadStory(2, 3) };
export const ManyUnread: Story = { render: unreadStory(120, 0) };
