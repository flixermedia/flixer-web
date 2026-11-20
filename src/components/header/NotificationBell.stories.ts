import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { createAgent } from "@ui-sdk/vue/agent";
import { expect, mocked, userEvent } from "storybook/test";
import { getAccessToken, markNotificationsRead } from "../../api";
import { useNotifications } from "../../composables/useNotifications";
import { notificationsFixture } from "../../storybook/fixturesSession";
import NotificationBell from "./NotificationBell.vue";

const buttonClass = "relative grid size-10 place-items-center rounded text-white/80 transition hover:bg-white/10 hover:text-white";

function bellStory(items: typeof notificationsFixture) {
	return (args: { buttonClass?: string; standalone?: boolean }) => ({
		components: { NotificationBell },
		setup() {
			const notifications = useNotifications();
			notifications.items.value = items;
			notifications.unread.value = items.filter((item) => !item.read).length;
			return { args };
		},
		template: '<div class="flex h-[28rem] w-96 justify-end"><NotificationBell v-bind="args" /></div>',
	});
}

const meta = {
	title: "Header/NotificationBell",
	component: NotificationBell,
	tags: ["autodocs"],
	args: { buttonClass },
	beforeEach: () => { mocked(getAccessToken).mockReturnValue(null); },
} satisfies Meta<typeof NotificationBell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Unread: Story = {
	render: bellStory(notificationsFixture),
	beforeEach: () => { mocked(markNotificationsRead).mockResolvedValue(undefined); },
	play: async ({ canvas }) => {
		await userEvent.click(canvas.getByRole("button", { name: "Notifications" }));
		const markRead = await canvas.findByRole("button", { name: "Mark all read" });
		const result = await createAgent().act({ steps: [{ ref: "Mark all read", action: "press" }] });
		await expect(result.ok).toBe(false);
		await expect(markNotificationsRead).not.toHaveBeenCalled();
		markRead.focus();
		await userEvent.keyboard("{Enter}");
		await expect(markNotificationsRead).toHaveBeenCalledTimes(1);
		await expect(canvas.queryByRole("button", { name: "Mark all read" })).not.toBeInTheDocument();
	},
};
export const Standalone: Story = { args: { standalone: true }, render: bellStory(notificationsFixture) };
export const Empty: Story = { args: { standalone: true }, render: bellStory([]) };
