import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { modalStory } from "../../storybook/modalStory";
import PasswordPromptModal from "./PasswordPromptModal.vue";

const meta = {
	title: "UI/PasswordPromptModal",
	component: PasswordPromptModal,
	tags: ["autodocs"],
	parameters: { layout: "fullscreen" },
	args: {
		title: "Confirm your password",
		description: "Enter your current password to continue.",
		passwordLabel: "Password",
		submitLabel: "Continue",
	},
	render: (args) => modalStory(PasswordPromptModal, args)(),
} satisfies Meta<typeof PasswordPromptModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Destructive: Story = {
	args: {
		title: "Delete your account?",
		description: "This permanently deletes your account and all associated data.",
		submitLabel: "Delete Account",
		danger: true,
	},
};
