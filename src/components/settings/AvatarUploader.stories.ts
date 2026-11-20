import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { createAgent } from "@ui-sdk/vue/agent";
import { expect, fireEvent, mocked, spyOn, userEvent, waitFor } from "storybook/test";
import { removeAvatar, uploadAvatar } from "../../api";
import { useProfile } from "../../composables/useProfile";
import { profileFixture } from "../../storybook/fixturesAccount";
import AvatarUploader from "./AvatarUploader.vue";

const meta = {
	title: "Settings/AvatarUploader",
	component: AvatarUploader,
	tags: ["autodocs"],
	beforeEach: () => {
		useProfile().setProfile(profileFixture);
		mocked(uploadAvatar).mockResolvedValue(profileFixture);
		mocked(removeAvatar).mockResolvedValue(profileFixture);
	},
} satisfies Meta<typeof AvatarUploader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const NativeFileLauncher: Story = {
	play: async ({ canvas, canvasElement }) => {
		const input = canvasElement.querySelector<HTMLInputElement>('input[type="file"]')!;
		const click = spyOn(input, "click").mockImplementation(() => undefined);
		const avatar = canvas.getByRole("button", { name: "Change profile picture" });
		avatar.focus();
		await userEvent.keyboard("{Enter}");
		expect(click).toHaveBeenCalledTimes(1);
		await userEvent.click(canvas.getByRole("button", { name: "Upload Picture" }));
		expect(click).toHaveBeenCalledTimes(2);
		expect(uploadAvatar).not.toHaveBeenCalled();
		const file = new File(["image"], "avatar.png", { type: "image/png" });
		const files = new DataTransfer();
		files.items.add(file);
		await fireEvent.change(input, { target: { files: files.files } });
		await waitFor(() => expect(uploadAvatar).toHaveBeenCalledWith(file));
		expect(input.value).toBe("");
		click.mockRestore();
	},
};
export const WithAvatar: Story = {
	beforeEach: () => {
		useProfile().setProfile({ ...profileFixture, avatarUrl: "/avatar.png" });
	},
	play: async ({ canvas }) => {
		const button = canvas.getByRole("button", { name: "Remove" });
		const denied = await createAgent().act({ steps: [{ ref: "Remove", action: "press" }] });
		expect(denied.ok).toBe(false);
		expect(removeAvatar).not.toHaveBeenCalled();
		button.focus();
		await userEvent.keyboard("{Enter}");
		await waitFor(() => expect(removeAvatar).toHaveBeenCalled());
	},
};
