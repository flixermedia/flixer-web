import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { mocked } from "storybook/test";
import { listSettings } from "../../api";
import { serverSettings } from "../../storybook/fixturesAdminAB";
import ErrorMonitoringSection from "./ErrorMonitoringSection.vue";

const meta = {
	title: "Admin/ErrorMonitoringSection",
	component: ErrorMonitoringSection,
	tags: ["autodocs"],
	render: () => ({ components: { ErrorMonitoringSection }, template: '<div class="max-w-3xl"><ErrorMonitoringSection /></div>' }),
} satisfies Meta<typeof ErrorMonitoringSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Enabled: Story = { beforeEach: () => void mocked(listSettings).mockResolvedValue(serverSettings) };
export const Disabled: Story = { beforeEach: () => void mocked(listSettings).mockResolvedValue([]) };
export const Loading: Story = { beforeEach: () => void mocked(listSettings).mockReturnValue(new Promise(() => undefined)) };
