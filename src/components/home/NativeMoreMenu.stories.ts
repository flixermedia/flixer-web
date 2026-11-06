import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { onBeforeUnmount } from "vue";
import { nativeMoreMenuOpen, nativeMoreTabs } from "../../platform/nativeNavigation";
import NativeMoreMenu from "./NativeMoreMenu.vue";

const meta = {
	title: "Home/NativeMoreMenu",
	component: NativeMoreMenu,
	tags: ["autodocs"],
	parameters: { layout: "fullscreen" },
	render: () => ({
		components: { NativeMoreMenu },
		setup() {
			nativeMoreTabs.value = [
				{ label: "Movies", to: "/movies", icon: "lucide:film" },
				{ label: "TV", to: "/tv", icon: "lucide:tv" },
				{ label: "Music", to: "/music", icon: "lucide:music-2" },
				{ label: "Chat", to: "/chat", icon: "lucide:messages-square" },
				{ label: "Guide", to: "/guide", icon: "lucide:calendar-days" },
			];
			nativeMoreMenuOpen.value = true;
			onBeforeUnmount(() => {
				nativeMoreMenuOpen.value = false;
				nativeMoreTabs.value = [];
			});
			return { open: nativeMoreMenuOpen };
		},
		template: '<div class="h-96"><button type="button" class="rounded border border-flixer-border px-4 py-2 text-sm" @click="open = true">Open menu</button><NativeMoreMenu /></div>',
	}),
} satisfies Meta<typeof NativeMoreMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
