import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { mocked } from "storybook/test";
import { updateSetting } from "../../api";
import { serverSettings } from "../../storybook/fixturesAdminAB";
import { modalStory } from "../../storybook/modalStory";
import SubtitlesSettingsModal from "./SubtitlesSettingsModal.vue";

const meta = {
	title: "Admin/SubtitlesSettingsModal",
	component: SubtitlesSettingsModal,
	tags: ["autodocs"],
	parameters: { layout: "fullscreen" },
	render: (args) => modalStory(SubtitlesSettingsModal, args)(),
	beforeEach: () => void mocked(updateSetting).mockResolvedValue(serverSettings[0]),
} satisfies Meta<typeof SubtitlesSettingsModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NotConfigured: Story = {};
export const Configured: Story = { args: { stored: { apiKey: "********", username: "flixer", password: "********", languages: ["en", "es"], autoFetch: true } } };
export const SaveError: Story = { beforeEach: () => void mocked(updateSetting).mockRejectedValue(new Error("Could not save")) };
