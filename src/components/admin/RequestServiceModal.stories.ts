import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { closeAllModals } from "@kolirt/vue-modal";
import { expect, mocked, userEvent, waitFor, within } from "storybook/test";
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
	beforeEach: async () => {
		await closeAllModals({ ignoreGuard: true, instantExit: true });
		mocked(testRequestService).mockResolvedValue(requestServiceTest);
		mocked(saveRequestService).mockResolvedValue(requestServices[0]);
		return async () => { await closeAllModals({ ignoreGuard: true, instantExit: true }); };
	},
} satisfies Meta<typeof RequestServiceModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AddService: Story = {};
export const ChangeServiceKind: Story = {
	play: async ({ canvasElement }) => {
		const page = within(canvasElement.ownerDocument.body);
		const dialogs = await page.findAllByRole("dialog");
		const dialog = dialogs.at(-1);
		if (!dialog) throw new Error("Missing request service dialog");
		await waitFor(() => expect(dialog).toHaveAttribute("data-state", "open"));
		const form = within(dialog);
		const kind = form.getByRole("combobox", { name: "Service Type" });
		await userEvent.click(kind);
		await userEvent.click(await page.findByRole("option", { name: "Radarr" }));
		await expect(dialog).toHaveAttribute("data-state", "open");
		await userEvent.type(form.getByRole("textbox", { name: "URL" }), "https://radarr.example");
		await userEvent.click(form.getByRole("button", { name: /test connection/i }));
		await waitFor(() => expect(mocked(testRequestService)).toHaveBeenCalledWith(expect.objectContaining({
			kind: "radarr", url: "https://radarr.example",
		})));
		await userEvent.click(form.getByRole("button", { name: "Cancel" }));
	},
};
export const EditService: Story = { args: { service: requestServices[0] } };
export const TestFails: Story = {
	args: { service: requestServices[1] },
	beforeEach: () => {
		mocked(testRequestService).mockResolvedValue({ ...requestServiceTest, ok: false, version: null, error: "Connection refused", qualityProfiles: [], rootFolders: [] });
	},
};
