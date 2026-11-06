import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { mocked } from "storybook/test";
import { getAccessOptions, getUserAccess, listMediaLibraries, previewUserAccess, saveUserAccess } from "../../api";
import { accessOptions, accessPolicy, accessPreview, adminUser, mediaLibraries } from "../../storybook/fixturesAdmin";
import { modalStory } from "../../storybook/modalStory";
import AccessControlsModal from "./AccessControlsModal.vue";

const meta = {
	title: "Admin/AccessControlsModal",
	component: AccessControlsModal,
	tags: ["autodocs"],
	parameters: { layout: "fullscreen" },
	args: { user: adminUser },
	render: (args) => modalStory(AccessControlsModal, args)(),
	beforeEach: () => {
		mocked(getUserAccess).mockResolvedValue(accessPolicy);
		mocked(listMediaLibraries).mockResolvedValue(mediaLibraries);
		mocked(getAccessOptions).mockResolvedValue(accessOptions);
		mocked(previewUserAccess).mockResolvedValue(accessPreview);
		mocked(saveUserAccess).mockResolvedValue(accessPolicy);
	},
} satisfies Meta<typeof AccessControlsModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Restricted: Story = {};
export const Unrestricted: Story = {
	beforeEach: () => {
		mocked(getUserAccess).mockResolvedValue({ libraryMode: "all", libraryIds: [], maxAge: null, blockUnrated: false, allowedTags: [], blockedTags: [], schedule: null, requireRequestApproval: false, hasPin: false });
	},
};
