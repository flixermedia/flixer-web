import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { ref } from "vue";
import SettingsTabs from "./SettingsTabs.vue";

const meta = {
	title: "Settings/SettingsTabs",
	component: SettingsTabs,
	tags: ["autodocs"],
	args: {
		modelValue: "profile",
		tabs: [
			{ id: "profile", label: "Profile" },
			{ id: "security", label: "Security" },
			{ id: "language", label: "Language" },
		],
	},
	render: (args) => ({ components: { SettingsTabs }, setup: () => ({ args, active: ref(args.modelValue) }), template: '<SettingsTabs v-bind="args" v-model="active" />' }),
} satisfies Meta<typeof SettingsTabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const NoBackground: Story = { args: { background: false } };
