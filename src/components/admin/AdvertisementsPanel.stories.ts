import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, fireEvent, mocked, userEvent, waitFor, within } from "storybook/test";
import { getAdvertisementSettings, listAdvertisements, saveAdvertisement, saveAdvertisementSettings, uploadAdvertisement, type Advertisement } from "../../api/advertisements";
import AdvertisementsPanel from "./AdvertisementsPanel.vue";

const ad: Advertisement = {
	id: "ad-1", name: "Example", targetUrl: "https://example.com/", durationSeconds: 30.5,
	enabled: false, scopes: [{ type: "all", ref: null }], preroll: true, midrollSeconds: [600], skipAfterSeconds: null,
};

const meta = {
	title: "Admin/Advertisements",
	component: AdvertisementsPanel,
	beforeEach: () => {
		mocked(listAdvertisements).mockResolvedValue([ad]);
		mocked(getAdvertisementSettings).mockResolvedValue({ enabled: false, minimumIntervalSeconds: 300, maxPerPlayback: 5 });
		mocked(saveAdvertisementSettings).mockImplementation(async (settings) => settings);
		mocked(saveAdvertisement).mockImplementation(async (value) => value);
		mocked(uploadAdvertisement).mockResolvedValue(ad);
	},
} satisfies Meta<typeof AdvertisementsPanel>;
export default meta;
type Story = StoryObj<typeof meta>;

export const SettingsAndEdit: Story = {
	play: async ({ canvas, canvasElement }) => {
		const enabled = await canvas.findByRole("switch", { name: /Enable advertisements/i });
		await userEvent.click(enabled);
		await userEvent.click(canvas.getAllByRole("button", { name: "Save Changes" })[0]!);
		await waitFor(() => expect(saveAdvertisementSettings).toHaveBeenCalledWith(expect.objectContaining({ enabled: true })));
		await userEvent.click(canvas.getByRole("button", { name: "Edit" }));
		const editor = within(canvasElement.ownerDocument.body);
		await editor.findByText("Edit advertisement");
		await userEvent.clear(editor.getByLabelText(/Mid-roll break positions/));
		await userEvent.type(editor.getByLabelText(/Mid-roll break positions/), "120, 300");
		await userEvent.click(editor.getByRole("button", { name: "Save Changes" }));
		await waitFor(() => expect(saveAdvertisement).toHaveBeenCalledWith(expect.objectContaining({ midrollSeconds: [120, 300] })));
	},
};

export const Upload: Story = {
	play: async ({ canvas, canvasElement }) => {
		await canvas.findByRole("switch", { name: /Enable advertisements/i });
		await userEvent.click(canvas.getByRole("button", { name: "Upload advertisement" }));
		const modal = within(canvasElement.ownerDocument.body);
		await userEvent.type(await modal.findByLabelText("Name"), "Example");
		await userEvent.type(modal.getByLabelText("Advertiser URL"), "https://example.com");
		await userEvent.upload(modal.getByLabelText("Video file"), new File(["video"], "example.mp4", { type: "video/mp4" }));
		expect((modal.getByLabelText("Video file") as HTMLInputElement).files).toHaveLength(1);
		const form = (modal.getByLabelText("Video file") as HTMLInputElement).form!;
		await fireEvent.submit(form);
		await waitFor(() => expect(uploadAdvertisement).toHaveBeenCalled());
		await waitFor(() => expect(within(canvasElement.ownerDocument.body).getByText("Edit advertisement")).toBeVisible());
	},
};
