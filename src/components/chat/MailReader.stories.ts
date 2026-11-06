import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { useMailbox } from "../../composables/useMailbox";
import { mailMessage } from "../../storybook/fixturesMail";
import MailReader from "./MailReader.vue";

function readerStory(message: typeof mailMessage | null) {
	return () => ({
		components: { MailReader },
		setup() {
			const mail = useMailbox();
			mail.active.value = message;
			mail.readerLoading.value = false;
		},
		template: '<div class="flex h-[32rem] w-[40rem] flex-col border border-white/10"><MailReader /></div>',
	});
}

const meta = {
	title: "Chat/MailReader",
	component: MailReader,
	tags: ["autodocs"],
	parameters: { layout: "fullscreen" },
} satisfies Meta<typeof MailReader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const HtmlMessage: Story = { render: readerStory(mailMessage) };
export const PlainText: Story = { render: readerStory({ ...mailMessage, html: null, attachments: [], authResults: null }) };
export const NothingSelected: Story = { render: readerStory(null) };
