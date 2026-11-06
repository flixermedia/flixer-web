import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { mocked } from "storybook/test";
import { onMounted } from "vue";
import { listMyMailMessages } from "../../api";
import { useMailbox } from "../../composables/useMailbox";
import { mailSummaries } from "../../storybook/fixturesMail";
import MailList from "./MailList.vue";

const meta = {
	title: "Chat/MailList",
	component: MailList,
	tags: ["autodocs"],
	parameters: { layout: "fullscreen" },
	render: () => ({
		components: { MailList },
		setup() {
			const mail = useMailbox();
			onMounted(() => void mail.load());
		},
		template: '<div class="flex h-[32rem] w-96 flex-col border border-white/10"><MailList /></div>',
	}),
} satisfies Meta<typeof MailList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Messages: Story = {
	beforeEach: () => {
		mocked(listMyMailMessages).mockResolvedValue({ total: 3, page: 1, limit: 30, items: mailSummaries });
	},
};
export const Paginated: Story = {
	beforeEach: () => {
		mocked(listMyMailMessages).mockResolvedValue({ total: 90, page: 1, limit: 30, items: mailSummaries });
	},
};
export const Empty: Story = {
	beforeEach: () => {
		mocked(listMyMailMessages).mockResolvedValue({ total: 0, page: 1, limit: 30, items: [] });
	},
};
export const LoadFailed: Story = {
	beforeEach: () => {
		mocked(listMyMailMessages).mockRejectedValue(new Error("Could not load messages."));
	},
};
