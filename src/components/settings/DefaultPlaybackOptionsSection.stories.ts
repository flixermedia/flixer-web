import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { createAgent } from "@ui-sdk/vue/agent";
import { expect, mocked, userEvent, waitFor } from "storybook/test";
import { getPreferences, updatePreferences } from "../../api";
import DefaultPlaybackOptionsSection from "./DefaultPlaybackOptionsSection.vue";

const meta = {
	title: "Settings/DefaultPlaybackOptionsSection",
	component: DefaultPlaybackOptionsSection,
	tags: ["autodocs"],
	beforeEach: () => {
		mocked(getPreferences).mockResolvedValue({ autoSkipIntroCredits: true, audioLanguage: "en" } as never);
		mocked(updatePreferences).mockResolvedValue({} as never);
	},
} satisfies Meta<typeof DefaultPlaybackOptionsSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const SkipDisabled: Story = {
	beforeEach: () => {
		mocked(getPreferences).mockResolvedValue({ autoSkipIntroCredits: false, audioLanguage: "ja" } as never);
	},
};
export const Loading: Story = {
	beforeEach: () => {
		mocked(getPreferences).mockReturnValue(new Promise(() => undefined));
	},
};

export const TogglePreferences: Story = {
	play: async ({ canvas }) => {
		const checkboxes = await canvas.findAllByRole("checkbox");
		await waitFor(() => expect(checkboxes[0]).toBeEnabled());
		await expect(checkboxes[0]).toBeChecked();
		await expect(checkboxes[1]).toBeChecked();
		checkboxes[0]!.focus();
		await userEvent.keyboard(" ");
		await waitFor(() => expect(mocked(updatePreferences)).toHaveBeenCalledWith({ autoSkipIntroCredits: false }));
		await expect(checkboxes[0]).not.toBeChecked();
		await waitFor(() => expect(checkboxes[1]).toBeEnabled());
		const agent = createAgent();
		const entry = agent.snapshot().find((item) => item.component === "checkbox" && item.label?.includes("word timing"));
		await expect(entry?.label).toBeTruthy();
		const result = await agent.act({ steps: [{ ref: entry!.ref, action: "setChecked", args: [false] }] });
		await expect(result.ok, result.error?.message).toBe(true);
		await waitFor(() => expect(mocked(updatePreferences)).toHaveBeenCalledWith({ emulateLyricWordTiming: false }));
		await expect(checkboxes[1]).not.toBeChecked();
	},
};

export const FailedPreference: Story = {
	beforeEach: () => { mocked(updatePreferences).mockRejectedValue(new Error("offline")); },
	play: async ({ canvas }) => {
		const checkbox = (await canvas.findAllByRole("checkbox"))[0]!;
		await waitFor(() => expect(checkbox).toBeEnabled());
		await userEvent.click(checkbox);
		await waitFor(() => expect(mocked(updatePreferences)).toHaveBeenCalledWith({ autoSkipIntroCredits: false }));
		await waitFor(() => expect(checkbox).toBeChecked());
	},
};
