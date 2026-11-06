import type { Meta, StoryObj } from "@storybook/vue3-vite";
import OfflineBanner from "./OfflineBanner.vue";

const meta = {
	title: "UI/OfflineBanner",
	component: OfflineBanner,
	tags: ["autodocs"],
	parameters: { layout: "fullscreen", docs: { description: { component: "Appears at the bottom of the screen while the browser is offline. Toggle the network offline in devtools to see it." } } },
} satisfies Meta<typeof OfflineBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
