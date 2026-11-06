import type { Meta, StoryObj } from "@storybook/vue3-vite";
import LanguageSection from "./LanguageSection.vue";

const meta = {
	title: "Settings/LanguageSection",
	component: LanguageSection,
	tags: ["autodocs"],
} satisfies Meta<typeof LanguageSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
