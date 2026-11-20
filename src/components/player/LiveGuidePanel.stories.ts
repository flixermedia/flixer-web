import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { createAgent } from "@ui-sdk/vue/agent";
import { expect, fireEvent, fn, mocked, userEvent } from "storybook/test";
import { getGuide } from "../../api/guide";
import { guideChannels, guideFixture } from "../../storybook/fixturesPlayer";
import LiveGuidePanel from "./LiveGuidePanel.vue";

const meta = {
	title: "Player/LiveGuidePanel",
	component: LiveGuidePanel,
	tags: ["autodocs"],
	parameters: { layout: "fullscreen" },
	args: { currentChannelId: "ch1", switchingChannelId: "", switchError: "", onClose: fn(), "onSelect-channel": fn() },
	decorators: [() => ({ template: '<div class="theme-dark relative h-[36rem] w-full overflow-hidden bg-black"><story /></div>' })],
	beforeEach: () => void mocked(getGuide).mockResolvedValue(guideFixture()),
} satisfies Meta<typeof LiveGuidePanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	play: async ({ args, canvas }) => {
		const search = canvas.getByRole("searchbox", { name: "Search channels" });
		await canvas.findByRole("button", { name: /Movie Central/ });
		await fireEvent.compositionStart(search);
		await fireEvent.input(search, { target: { value: "Kids" }, isComposing: true });
		await expect(canvas.getByRole("button", { name: /Movie Central/ })).toBeVisible();
		await fireEvent.compositionEnd(search);
		await expect(canvas.queryByRole("button", { name: /Movie Central/ })).not.toBeInTheDocument();

		await userEvent.clear(search);
		await userEvent.type(search, "Kids Zone");
		await expect(search).toHaveValue("Kids Zone");
		await expect(canvas.getByRole("button", { name: /Kids Zone/ })).toBeVisible();
		await expect(canvas.queryByRole("button", { name: /Movie Central/ })).not.toBeInTheDocument();

		await userEvent.clear(search);
		await expect(canvas.getByRole("button", { name: /Movie Central/ })).toBeVisible();
		await expect(createAgent().snapshot()).toEqual(expect.arrayContaining([
			expect.objectContaining({ component: "input", label: "Search channels" }),
			expect.objectContaining({ component: "button", label: "Close live TV guide" }),
		]));

		await userEvent.click(canvas.getByRole("button", { name: "Close live TV guide" }));
		await expect(args.onClose).toHaveBeenCalledTimes(1);
		await expect(args["onSelect-channel"]).not.toHaveBeenCalled();
	},
};
export const SelectChannel: Story = {
	play: async ({ args, canvas }) => {
		const channel = await canvas.findByRole("button", { name: /Movie Central/ });
		const agent = createAgent();
		expect(agent.snapshot()).toEqual(expect.arrayContaining([
			expect.objectContaining({ component: "button", label: expect.stringContaining("Movie Central") }),
		]));
		channel.focus();
		await userEvent.keyboard("{Enter}");
		await expect(args["onSelect-channel"]).toHaveBeenCalledTimes(1);
		await expect(args["onSelect-channel"]).toHaveBeenCalledWith(expect.objectContaining({ name: "Movie Central" }));
	},
};
export const SwitchingChannel: Story = {
	args: { switchingChannelId: "ch2" },
	play: async ({ canvas }) => {
		await expect(await canvas.findByRole("button", { name: /Movie Central/ })).toBeDisabled();
	},
};
export const SwitchError: Story = { args: { switchError: "Could not start this channel." } };
export const MoreChannelsAvailable: Story = { beforeEach: () => void mocked(getGuide).mockResolvedValue(guideFixture(guideChannels, 120)) };
export const NoChannels: Story = { beforeEach: () => void mocked(getGuide).mockResolvedValue(guideFixture([], 0)) };
export const Loading: Story = { beforeEach: () => void mocked(getGuide).mockReturnValue(new Promise(() => undefined)) };
export const LoadError: Story = { beforeEach: () => void mocked(getGuide).mockRejectedValue(new Error("Network error")) };
