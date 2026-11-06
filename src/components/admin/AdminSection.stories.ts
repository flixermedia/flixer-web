import type { Meta, StoryObj } from "@storybook/vue3-vite";
import AdminSection from "./AdminSection.vue";

const meta = {
	title: "Admin/AdminSection",
	component: AdminSection,
	tags: ["autodocs"],
	args: { title: "Networking", description: "Ports and public addresses." },
	render: (args) => ({
		components: { AdminSection },
		setup: () => ({ args }),
		template: '<AdminSection v-bind="args" class="w-[32rem]"><template #actions><button class="rounded border border-flixer-border px-3 py-1 text-sm">Action</button></template>Section content</AdminSection>',
	}),
} satisfies Meta<typeof AdminSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Compact: Story = { args: { compact: true } };
