import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { mocked } from "storybook/test";
import { saveRequestService, testRequestService } from "../../api";
import { requestServiceTest, requestServices } from "../../storybook/fixturesRequestsOps";
import { mediaLibraries } from "../../storybook/fixturesAdminAB";
import { modalStory } from "../../storybook/modalStory";
import RequestServiceModal from "./RequestServiceModal.vue";

const meta = {
	title: "Admin/RequestServiceModal",
	component: RequestServiceModal,
	tags: ["autodocs"],
	parameters: { layout: "fullscreen" },
	args: { libraries: mediaLibraries },
	render: (args) => modalStory(RequestServiceModal, args)(),
	beforeEach: () => {
		mocked(testRequestService).mockResolvedValue(requestServiceTest);
		mocked(saveRequestService).mockResolvedValue(requestServices[0]);
	},
} satisfies Meta<typeof RequestServiceModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AddService: Story = {};
export const EditService: Story = { args: { service: requestServices[0] } };
export const TestFails: Story = {
	args: { service: requestServices[1] },
	beforeEach: () => {
		mocked(testRequestService).mockResolvedValue({ ...requestServiceTest, ok: false, version: null, error: "Connection refused", qualityProfiles: [], rootFolders: [] });
	},
};
