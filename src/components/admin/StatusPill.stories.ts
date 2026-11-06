import type { Meta, StoryObj } from "@storybook/vue3-vite";
import StatusPill from "./StatusPill.vue";

const meta = {
	title: "Admin/StatusPill",
	component: StatusPill,
	tags: ["autodocs"],
	args: { tone: "neutral" },
	argTypes: { tone: { control: "inline-radio", options: ["good", "warn", "bad", "neutral", "accent"] } },
	render: (args) => ({ components: { StatusPill }, setup: () => ({ args }), template: '<StatusPill v-bind="args">Status</StatusPill>' }),
} satisfies Meta<typeof StatusPill>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Neutral: Story = {};
export const Good: Story = { args: { tone: "good" } };
export const Warn: Story = { args: { tone: "warn" } };
export const Bad: Story = { args: { tone: "bad" } };
export const Accent: Story = { args: { tone: "accent" } };
