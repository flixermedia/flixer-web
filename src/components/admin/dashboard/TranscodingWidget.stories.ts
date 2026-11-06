import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { adminOverview } from "../../../storybook/fixturesAdmin";
import TranscodingWidget from "./TranscodingWidget.vue";

const withStreamer = (streamer: Partial<typeof adminOverview.server.streamer>) => ({ ...adminOverview, server: { ...adminOverview.server, streamer: { ...adminOverview.server.streamer, ...streamer } } });

const meta = {
	title: "Admin/Dashboard/TranscodingWidget",
	component: TranscodingWidget,
	tags: ["autodocs"],
	args: { overview: adminOverview },
	render: (args) => ({ components: { TranscodingWidget }, setup: () => ({ args }), template: '<div class="w-72"><TranscodingWidget v-bind="args" /></div>' }),
} satisfies Meta<typeof TranscodingWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Idle: Story = { args: { overview: withStreamer({ activeTranscodes: 0, sessions: 0 }) } };
export const Saturated: Story = { args: { overview: withStreamer({ activeTranscodes: 4, sessions: 7 }) } };
export const TranscodingUnavailable: Story = { args: { overview: withStreamer({ transcodingAvailable: false }) } };
export const StreamerOffline: Story = { args: { overview: withStreamer({ reachable: false }) } };
