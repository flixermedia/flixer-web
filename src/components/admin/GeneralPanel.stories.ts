import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { mocked } from "storybook/test";
import { listSettings } from "../../api";
import { serverSettings } from "../../storybook/fixturesAdminAB";
import GeneralPanel from "./GeneralPanel.vue";

const meta = {
	title: "Admin/GeneralPanel",
	component: GeneralPanel,
	tags: ["autodocs"],
	render: () => ({ components: { GeneralPanel }, template: '<div class="max-w-3xl"><GeneralPanel /></div>' }),
	beforeEach: () => void mocked(listSettings).mockResolvedValue(serverSettings),
} satisfies Meta<typeof GeneralPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
