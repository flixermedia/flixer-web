import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { mocked } from "storybook/test";
import { changePassword } from "../../api";
import PasswordSection from "./PasswordSection.vue";

const meta = {
	title: "Settings/PasswordSection",
	component: PasswordSection,
	tags: ["autodocs"],
	beforeEach: () => {
		mocked(changePassword).mockResolvedValue(undefined as never);
	},
} satisfies Meta<typeof PasswordSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
