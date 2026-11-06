import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { fn } from "storybook/test";
import { ADMIN_TABS, type AdminPageId, type AdminTabId, type AdminTabItem } from "./adminNav";
import AdminSidebar from "./AdminSidebar.vue";

const label = (id: string) => id.replace(/([A-Z])/g, " $1").replace(/^./, (char) => char.toUpperCase());
const tabs: AdminTabItem[] = (Object.keys(ADMIN_TABS) as AdminTabId[]).map((id) => ({
	id,
	label: label(id),
	pages: ADMIN_TABS[id].map((page: AdminPageId) => ({ id: page, label: label(page) })),
}));

const meta = {
	title: "Admin/AdminSidebar",
	component: AdminSidebar,
	tags: ["autodocs"],
	parameters: { layout: "fullscreen" },
	args: {
		tabs,
		active: { tab: "library", page: "tasks" },
		title: "Administration",
		subtitle: "flixer-home",
		compact: false,
		onSelect: fn(),
		onToggleCompact: fn(),
	},
	decorators: [() => ({ template: '<div class="h-[720px]"><story /></div>' })],
} satisfies Meta<typeof AdminSidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Settings: Story = { args: { active: { tab: "settings", page: "users" } } };
export const Compact: Story = { args: { compact: true } };
