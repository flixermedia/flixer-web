import type { Meta, StoryObj } from "@storybook/vue3-vite";
import UserAvatar from "./UserAvatar.vue";

const meta = {
	title: "UI/UserAvatar",
	component: UserAvatar,
	tags: ["autodocs"],
	args: { avatarUrl: null, name: "Ashley" },
	decorators: [() => ({ template: '<div class="size-16 overflow-hidden rounded-full text-2xl"><story /></div>' })],
} satisfies Meta<typeof UserAvatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Initial: Story = {};
export const NoName: Story = { args: { name: undefined } };
