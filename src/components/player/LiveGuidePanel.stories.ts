import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { fn, mocked } from "storybook/test";
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

export const Default: Story = {};
export const SwitchingChannel: Story = { args: { switchingChannelId: "ch2" } };
export const SwitchError: Story = { args: { switchError: "Could not start this channel." } };
export const MoreChannelsAvailable: Story = { beforeEach: () => void mocked(getGuide).mockResolvedValue(guideFixture(guideChannels, 120)) };
export const NoChannels: Story = { beforeEach: () => void mocked(getGuide).mockResolvedValue(guideFixture([], 0)) };
export const Loading: Story = { beforeEach: () => void mocked(getGuide).mockReturnValue(new Promise(() => undefined)) };
export const LoadError: Story = { beforeEach: () => void mocked(getGuide).mockRejectedValue(new Error("Network error")) };
