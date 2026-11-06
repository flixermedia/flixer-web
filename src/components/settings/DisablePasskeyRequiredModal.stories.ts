import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { mocked } from "storybook/test";
import { setPasskeyRequired } from "../../api";
import { modalStory } from "../../storybook/modalStory";
import { profileFixture } from "../../storybook/fixturesAccount";
import DisablePasskeyRequiredModal from "./DisablePasskeyRequiredModal.vue";

const meta = {
	title: "Settings/DisablePasskeyRequiredModal",
	component: DisablePasskeyRequiredModal,
	tags: ["autodocs"],
	parameters: { layout: "fullscreen" },
	beforeEach: () => {
		mocked(setPasskeyRequired).mockResolvedValue(profileFixture);
	},
	render: (args) => modalStory(DisablePasskeyRequiredModal, args)(),
} satisfies Meta<typeof DisablePasskeyRequiredModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Fails: Story = {
	beforeEach: () => {
		mocked(setPasskeyRequired).mockRejectedValue(new Error("Incorrect password."));
	},
};
