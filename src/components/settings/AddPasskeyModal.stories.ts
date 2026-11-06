import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { mocked } from "storybook/test";
import { getPasskeyRegistrationOptions } from "../../api";
import { modalStory } from "../../storybook/modalStory";
import AddPasskeyModal from "./AddPasskeyModal.vue";

const meta = {
	title: "Settings/AddPasskeyModal",
	component: AddPasskeyModal,
	tags: ["autodocs"],
	parameters: { layout: "fullscreen" },
	beforeEach: () => {
		mocked(getPasskeyRegistrationOptions).mockResolvedValue({ challenge: "challenge", rp: { name: "Flixer" }, user: { id: "u1", name: "demo", displayName: "Demo" }, pubKeyCredParams: [{ type: "public-key", alg: -7 }] });
	},
	render: () => modalStory(AddPasskeyModal)(),
} satisfies Meta<typeof AddPasskeyModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WrongPassword: Story = {
	beforeEach: () => {
		mocked(getPasskeyRegistrationOptions).mockRejectedValue(new Error("Invalid password"));
	},
};
