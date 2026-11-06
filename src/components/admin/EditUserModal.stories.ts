import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { adminUsers } from "../../storybook/fixturesAdminAB";
import { modalStory } from "../../storybook/modalStory";
import EditUserModal from "./EditUserModal.vue";

const meta = {
	title: "Admin/EditUserModal",
	component: EditUserModal,
	tags: ["autodocs"],
	parameters: { layout: "fullscreen" },
	args: { user: adminUsers[1] },
	render: (args) => modalStory(EditUserModal, args)(),
} satisfies Meta<typeof EditUserModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const CurrentAdmin: Story = { args: { user: adminUsers[0] } };
export const DisabledUser: Story = { args: { user: adminUsers[2] } };
