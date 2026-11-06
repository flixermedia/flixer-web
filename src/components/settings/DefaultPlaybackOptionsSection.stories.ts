import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { mocked } from "storybook/test";
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
