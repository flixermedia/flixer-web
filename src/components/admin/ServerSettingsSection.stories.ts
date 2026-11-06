import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { mocked } from "storybook/test";
import { listSettings, updateSetting } from "../../api";
import { serverSettings } from "../../storybook/fixturesAdminAB";
import ServerSettingsSection from "./ServerSettingsSection.vue";

const meta = {
	title: "Admin/ServerSettingsSection",
	component: ServerSettingsSection,
	tags: ["autodocs"],
	render: () => ({ components: { ServerSettingsSection }, template: '<div class="w-[40rem]"><ServerSettingsSection /></div>' }),
	beforeEach: () => {
		mocked(listSettings).mockResolvedValue(serverSettings);
		mocked(updateSetting).mockResolvedValue(serverSettings[0]);
	},
} satisfies Meta<typeof ServerSettingsSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Empty: Story = { beforeEach: () => void mocked(listSettings).mockResolvedValue([]) };
export const Loading: Story = { beforeEach: () => void mocked(listSettings).mockReturnValue(new Promise(() => undefined)) };
export const LoadError: Story = { beforeEach: () => void mocked(listSettings).mockRejectedValue(new Error("Network error")) };
