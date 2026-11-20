import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { closeModalsByGroup, ModalClosedError, openModal } from "@kolirt/vue-modal";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { ref } from "vue";
import { modalStory } from "../../storybook/modalStory";
import PasswordPromptModal from "./PasswordPromptModal.vue";

const meta = {
	title: "UI/PasswordPromptModal",
	component: PasswordPromptModal,
	tags: ["autodocs"],
	parameters: { layout: "fullscreen" },
	beforeEach: () => async () => { await closeModalsByGroup("default", { instantExit: true }); },
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

export const Default: Story = {
	play: async () => {
		const button = await within(document.body).findByRole("button", { name: "Continue" });
		await expect(getComputedStyle(button).backgroundImage).not.toBe("none");
	},
};
export const Destructive: Story = {
	args: {
		title: "Delete your account?",
		description: "This permanently deletes your account and all associated data.",
		submitLabel: "Delete Account",
		danger: true,
	},
	play: async () => {
		const button = await within(document.body).findByRole("button", { name: "Delete Account" });
		const reference = document.createElement("span");
		reference.style.backgroundColor = "var(--color-rose-600)";
		document.body.append(reference);
		try {
			const expected = getComputedStyle(reference).backgroundColor;
			await expect(getComputedStyle(button).backgroundColor).toBe(expected);
		} finally {
			reference.remove();
		}
	},
};
export const Submission: Story = {
	render: (args) => ({
		setup() {
			const result = ref("waiting");
			const open = async () => {
				try {
					result.value = await openModal<string>(PasswordPromptModal, { props: args });
				} catch (error) {
					if (!(error instanceof ModalClosedError)) throw error;
					result.value = "cancelled";
				}
			};
			return { open, result };
		},
		template: '<button type="button" @click="open">Open password prompt</button><output data-testid="result">{{ result }}</output>',
	}),
	play: async ({ canvas }) => {
		const page = within(document.body);
		await userEvent.click(await canvas.findByRole("button", { name: "Open password prompt" }));
		await userEvent.click(await page.findByRole("button", { name: "Cancel" }));
		await waitFor(() => expect(canvas.getByTestId("result")).toHaveTextContent("cancelled"));
		await userEvent.click(await canvas.findByRole("button", { name: "Open password prompt" }));
		const password = await page.findByLabelText("Password");
		await expect(password).toBeRequired();
		await userEvent.type(password, "correct horse");
		await userEvent.click(page.getByRole("button", { name: "Continue" }));
		await waitFor(() => expect(canvas.getByTestId("result")).toHaveTextContent("correct horse"));
	},
};
