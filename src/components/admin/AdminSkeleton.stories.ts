import type { Meta, StoryObj } from "@storybook/vue3-vite";
import AdminSkeleton from "./AdminSkeleton.vue";

const meta = {
	title: "Admin/AdminSkeleton",
	component: AdminSkeleton,
	tags: ["autodocs"],
	parameters: { layout: "padded" },
	args: { variant: "cards", rows: 2 },
	argTypes: { variant: { control: "select", options: ["cards", "tasks", "table", "stats", "fields", "toggles", "tracks"] } },
} satisfies Meta<typeof AdminSkeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Cards: Story = {};
export const Tasks: Story = { args: { variant: "tasks" } };
export const Table: Story = { args: { variant: "table" } };
export const Stats: Story = { args: { variant: "stats" } };
export const Fields: Story = { args: { variant: "fields" } };
export const Toggles: Story = { args: { variant: "toggles" } };
export const Tracks: Story = { args: { variant: "tracks" } };
