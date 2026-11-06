import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { computed, shallowRef } from "vue";
import type { CallPhase, useChatCall } from "../../composables/useChatCall";
import ChatCallOverlay from "./ChatCallOverlay.vue";

function fakeCall(options: { phase: CallPhase; video?: boolean; notice?: string; micMuted?: boolean }): ReturnType<typeof useChatCall> {
	return {
		available: computed(() => true),
		phase: computed(() => options.phase),
		peerLabel: computed(() => "Sam Chen"),
		video: computed(() => options.video ?? false),
		micMuted: computed(() => options.micMuted ?? false),
		cameraOff: computed(() => false),
		notice: computed(() => options.notice ?? ""),
		localStream: shallowRef(null),
		remoteStream: shallowRef(null),
		startCall: async () => undefined,
		accept: async () => undefined,
		decline: () => undefined,
		hangUp: () => undefined,
		toggleMic: () => undefined,
		toggleCamera: () => undefined,
	} as unknown as ReturnType<typeof useChatCall>;
}

const meta = {
	title: "Chat/ChatCallOverlay",
	component: ChatCallOverlay,
	tags: ["autodocs"],
	parameters: { layout: "fullscreen" },
} satisfies Meta<typeof ChatCallOverlay>;

export default meta;
type Story = StoryObj<typeof meta>;

export const IncomingAudio: Story = { args: { state: fakeCall({ phase: "ringing" }) } };
export const IncomingVideo: Story = { args: { state: fakeCall({ phase: "ringing", video: true }) } };
export const Calling: Story = { args: { state: fakeCall({ phase: "calling" }) } };
export const ConnectedMuted: Story = { args: { state: fakeCall({ phase: "connected", micMuted: true }) } };
export const VideoConnected: Story = { args: { state: fakeCall({ phase: "connected", video: true }) } };
export const EndedNotice: Story = { args: { state: fakeCall({ phase: "idle", notice: "declined" }) } };
