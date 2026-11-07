import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, mocked, waitFor } from "storybook/test";
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
export const CompactViewport: Story = {
	play: async ({ canvasElement }) => {
		await waitFor(() => expect(canvasElement.querySelector(".flixer-modal-form-body")).not.toBeNull());
		const card = Array.from(canvasElement.querySelectorAll<HTMLElement>(".flixer-modal-card")).at(-1)!;
		const body = card.querySelector<HTMLElement>(".flixer-modal-form-body")!;
		const footer = card.querySelector<HTMLElement>(".flixer-modal-actions")!;
		card.style.maxHeight = "320px";
		await waitFor(() => expect(body.scrollHeight).toBeGreaterThan(body.clientHeight));
		const footerTop = footer.getBoundingClientRect().top;
		body.scrollTop = body.scrollHeight;
		await expect(footer.getBoundingClientRect().top).toBeCloseTo(footerTop, 0);
		await expect(footer.getBoundingClientRect().bottom).toBeLessThanOrEqual(card.getBoundingClientRect().bottom);
		await expect(footer.closest("form")).toBe(body.closest("form"));
		await expect(footer.querySelector('button[type="submit"]')).not.toBeNull();
		await expect(footer.querySelector('button[type="button"]')).not.toBeNull();
	},
};
export const CreateFails: Story = {
	beforeEach: () => {
		mocked(createAdminUser).mockRejectedValue(new Error("Username already taken"));
	},
};
