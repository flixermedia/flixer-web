import type { Meta, StoryObj } from "@storybook/vue3-vite";
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
} satisfies Meta<typeof NotificationBell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Unread: Story = { render: bellStory(notificationsFixture) };
export const Standalone: Story = { args: { standalone: true }, render: bellStory(notificationsFixture) };
export const Empty: Story = { args: { standalone: true }, render: bellStory([]) };
