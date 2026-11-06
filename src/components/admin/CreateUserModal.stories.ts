import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { mocked } from "storybook/test";
import { createAdminUser } from "../../api";
import { adminUser } from "../../storybook/fixturesAdmin";
import { modalStory } from "../../storybook/modalStory";
import CreateUserModal from "./CreateUserModal.vue";

const meta = {
	title: "Admin/CreateUserModal",
	component: CreateUserModal,
	tags: ["autodocs"],
	parameters: { layout: "fullscreen" },
	render: (args) => modalStory(CreateUserModal, args)(),
	beforeEach: () => {
		mocked(createAdminUser).mockResolvedValue(adminUser);
	},
} satisfies Meta<typeof CreateUserModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const CreateFails: Story = {
	beforeEach: () => {
		mocked(createAdminUser).mockRejectedValue(new Error("Username already taken"));
	},
};
