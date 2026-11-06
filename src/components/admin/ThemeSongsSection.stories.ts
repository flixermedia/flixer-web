import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { mocked } from "storybook/test";
import { listSettings, syncThemes, updateSetting } from "../../api";
import { serverSettings } from "../../storybook/fixturesAdminAB";
import ThemeSongsSection from "./ThemeSongsSection.vue";

const themesSetting = { ...serverSettings[0], key: "themes_enabled", value: true };

const meta = {
	title: "Admin/ThemeSongsSection",
	component: ThemeSongsSection,
	tags: ["autodocs"],
	render: () => ({ components: { ThemeSongsSection }, template: '<div class="w-[40rem]"><ThemeSongsSection /></div>' }),
	beforeEach: () => {
		mocked(listSettings).mockResolvedValue([themesSetting]);
		mocked(updateSetting).mockResolvedValue(themesSetting);
		mocked(syncThemes).mockResolvedValue({ queued: 12 } as Awaited<ReturnType<typeof syncThemes>>);
	},
} satisfies Meta<typeof ThemeSongsSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Enabled: Story = {};
export const Disabled: Story = { beforeEach: () => void mocked(listSettings).mockResolvedValue([{ ...themesSetting, value: false }]) };
export const LoadError: Story = { beforeEach: () => void mocked(listSettings).mockRejectedValue(new Error("Network error")) };
