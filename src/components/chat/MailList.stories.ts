import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { createAgent } from "@ui-sdk/vue/agent";
import { expect, mocked, userEvent, waitFor } from "storybook/test";
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
	play: async ({ canvas }) => {
		const previous = await canvas.findByRole("button", { name: "Previous" });
		await expect(previous).toBeDisabled();
		await userEvent.click(canvas.getByRole("button", { name: "Next" }));
		await expect(previous).toBeEnabled();
		await userEvent.click(previous);
		await expect(previous).toBeDisabled();
	},
};
export const Filters: Story = {
	beforeEach: () => {
		mocked(listMyMailMessages).mockResolvedValue({ total: 3, page: 1, limit: 30, items: mailSummaries });
	},
	play: async ({ canvas }) => {
		const unread = canvas.getByRole("button", { name: "Unread only" });
		const search = canvas.getByRole("searchbox", { name: "Search mail" });
		await userEvent.click(unread);
		await expect(unread).toHaveAttribute("aria-pressed", "true");
		const agent = createAgent();
		const result = await agent.act({ steps: [{ ref: "Search mail", action: "setValue", args: ["project update"] }] });
		await expect(result.ok, result.error?.message).toBe(true);
		await expect(search).toHaveValue("project update");
		await waitFor(() => expect(mocked(listMyMailMessages)).toHaveBeenLastCalledWith({
			search: "project update", unread: true, page: 1, limit: 30,
		}));
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
