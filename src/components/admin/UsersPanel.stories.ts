import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { mocked } from "storybook/test";
import { listAdminUsers, listSettings, updateSetting } from "../../api";
import { getMailStatus } from "../../api/mail";
import { setPaymentStatus } from "../../storybook/paymentsMocks";
import { adminUsers, serverSettings } from "../../storybook/fixturesAdminAB";
import UsersPanel from "./UsersPanel.vue";

const meta = {
	title: "Admin/UsersPanel",
	component: UsersPanel,
	tags: ["autodocs"],
	render: () => ({ components: { UsersPanel }, template: '<div class="max-w-4xl"><UsersPanel /></div>' }),
	beforeEach: async () => {
		await setPaymentStatus({ enabled: false });
		mocked(listAdminUsers).mockResolvedValue(adminUsers);
		mocked(listSettings).mockResolvedValue(serverSettings);
		mocked(updateSetting).mockResolvedValue(serverSettings[0]);
		mocked(getMailStatus).mockRejectedValue(new Error("Mail is not configured"));
	},
} satisfies Meta<typeof UsersPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const NoUsers: Story = { beforeEach: () => void mocked(listAdminUsers).mockResolvedValue([]) };
export const Loading: Story = { beforeEach: () => void mocked(listAdminUsers).mockReturnValue(new Promise(() => undefined)) };
export const LoadError: Story = { beforeEach: () => void mocked(listAdminUsers).mockRejectedValue(new Error("Network error")) };
export const WithPayments: Story = { beforeEach: async () => void (await setPaymentStatus()) };
