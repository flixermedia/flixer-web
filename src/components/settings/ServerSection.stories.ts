import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { createAgent } from "@ui-sdk/vue/agent";
import { expect, mocked, userEvent, waitFor } from "storybook/test";
import { listSettings, updateSetting } from "../../api";
import { serverSettingsFixture } from "../../storybook/fixturesAccount";
import ServerSection from "./ServerSection.vue";

const meta = {
	title: "Settings/ServerSection",
	component: ServerSection,
	tags: ["autodocs"],
	beforeEach: () => {
		mocked(listSettings).mockResolvedValue(serverSettingsFixture);
		mocked(updateSetting).mockImplementation(async (key, value) => ({ key, value, isPublic: false, updatedAt: new Date().toISOString() }) as never);
	},
} satisfies Meta<typeof ServerSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	play: async ({ canvas }) => {
		const registration = await canvas.findByRole("switch", { name: "Allow Registration" });
		await expect(registration).toBeChecked();
		const result = await createAgent().act({ steps: [{ ref: "Allow Registration", action: "setChecked", args: [false] }] });
		await expect(result.ok).toBe(false);
		await expect(updateSetting).not.toHaveBeenCalled();
		registration.focus();
		await userEvent.keyboard(" ");
		await waitFor(() => expect(registration).not.toBeChecked());
		await expect(updateSetting).toHaveBeenCalledWith("registration_enabled", false);
	},
};
export const RegistrationClosed: Story = {
	beforeEach: () => {
		mocked(listSettings).mockResolvedValue(serverSettingsFixture.map((setting) => (setting.key === "registration_enabled" ? { ...setting, value: false } : setting)));
	},
};
export const Loading: Story = {
	beforeEach: () => {
		mocked(listSettings).mockReturnValue(new Promise(() => undefined));
	},
};
