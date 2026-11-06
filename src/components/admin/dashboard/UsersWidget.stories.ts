import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { mocked } from "storybook/test";
import { listAdminUsers } from "../../../api";
import { adminUsers } from "../../../storybook/fixturesAdminAB";
import UsersWidget from "./UsersWidget.vue";

const meta = {
	title: "Admin/Dashboard/UsersWidget",
	component: UsersWidget,
	tags: ["autodocs"],
	render: () => ({ components: { UsersWidget }, template: '<div class="w-72"><UsersWidget /></div>' }),
} satisfies Meta<typeof UsersWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { beforeEach: () => void mocked(listAdminUsers).mockResolvedValue(adminUsers) };
export const Loading: Story = { beforeEach: () => void mocked(listAdminUsers).mockReturnValue(new Promise(() => undefined)) };
export const LoadError: Story = { beforeEach: () => void mocked(listAdminUsers).mockRejectedValue(new Error("Network error")) };
