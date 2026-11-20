import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, mocked, userEvent, waitFor, within } from "storybook/test";
import { listSettings, updateSetting } from "../../api";
import { transcodingSettings } from "../../storybook/fixturesRequestsOps";
import TranscodingPanel from "./TranscodingPanel.vue";

const meta = {
	title: "Admin/TranscodingPanel",
	component: TranscodingPanel,
	tags: ["autodocs"],
	parameters: { layout: "padded" },
	beforeEach: () => {
		mocked(listSettings).mockResolvedValue(transcodingSettings);
		mocked(updateSetting).mockResolvedValue(transcodingSettings[0]);
	},
} satisfies Meta<typeof TranscodingPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const AdjustQualityAndSave: Story = {
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const slider = await canvas.findByRole("slider", { name: "Constant rate factor" });
		slider.focus();
		await userEvent.keyboard("{End}");
		await expect(canvas.getByText("Constant rate factor: 32")).toBeVisible();
		await userEvent.keyboard("{Home}{ArrowRight}");
		await expect(canvas.getByText("Constant rate factor: 17")).toBeVisible();
		await expect(updateSetting).not.toHaveBeenCalled();
		await userEvent.click(canvas.getByRole("button", { name: "Save Changes" }));
		await waitFor(() => expect(updateSetting).toHaveBeenCalledWith("transcode_crf", 17));
		await expect(updateSetting).toHaveBeenCalledTimes(1);
	},
};
export const Defaults: Story = { beforeEach: () => void mocked(listSettings).mockResolvedValue([]) };
export const Loading: Story = { beforeEach: () => void mocked(listSettings).mockReturnValue(new Promise(() => undefined)) };
export const LoadError: Story = { beforeEach: () => void mocked(listSettings).mockRejectedValue(new Error("Network error")) };
