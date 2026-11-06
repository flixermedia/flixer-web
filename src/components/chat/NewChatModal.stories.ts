import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { mocked } from "storybook/test";
import { getProfiles } from "../../api";
import { modalStory } from "../../storybook/modalStory";
import { profilesFixture } from "../../storybook/fixturesProfiles";
import NewChatModal from "./NewChatModal.vue";

const meta = {
	title: "Chat/NewChatModal",
	component: NewChatModal,
	tags: ["autodocs"],
	parameters: { layout: "fullscreen" },
	render: (args) => modalStory(NewChatModal, args)(),
	beforeEach: () => {
		mocked(getProfiles).mockResolvedValue({ profiles: profilesFixture });
	},
} satisfies Meta<typeof NewChatModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const AddPeople: Story = { args: { addTo: { id: "chat-1", usernames: ["sam"] } } };
export const NoPeople: Story = {
	beforeEach: () => {
		mocked(getProfiles).mockResolvedValue({ profiles: [] });
	},
};
