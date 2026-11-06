import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { mocked } from "storybook/test";
import { getMailSettings, getMailStatus, listSettings, type MailSettings, type MailStatus } from "../../api";
import { serverSettings } from "../../storybook/fixturesAdminAB";
import EmailSettingsSection from "./EmailSettingsSection.vue";

const mailStatus: MailStatus = { inbound: { listening: true, port: 2525, error: null }, outboundReady: false, sender: null, domains: { total: 1, verified: 1 }, userAddressesEnabled: false };
const mailSettings: MailSettings = { inboundEnabled: true, inboundPort: 2525, hostname: "mail.example.com", maxMessageMb: 25, outboundEnabled: true, relayFallback: true, noreplyAddress: null, noreplyName: "Flixer", userAddressesEnabled: false, userAddressMode: "username", userAddressDomain: null };

const meta = {
	title: "Admin/EmailSettingsSection",
	component: EmailSettingsSection,
	tags: ["autodocs"],
	render: () => ({ components: { EmailSettingsSection }, template: '<div class="max-w-3xl"><EmailSettingsSection /></div>' }),
	beforeEach: () => {
		mocked(getMailStatus).mockResolvedValue(mailStatus);
		mocked(getMailSettings).mockResolvedValue(mailSettings);
		mocked(listSettings).mockResolvedValue(serverSettings);
	},
} satisfies Meta<typeof EmailSettingsSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const RelayConfigured: Story = {};
export const BuiltInMailReady: Story = {
	beforeEach: () => {
		mocked(getMailStatus).mockResolvedValue({ ...mailStatus, outboundReady: true, sender: "noreply@example.com" });
		mocked(listSettings).mockResolvedValue([]);
	},
};
export const NotConfigured: Story = { beforeEach: () => void mocked(listSettings).mockResolvedValue([]) };
export const Loading: Story = { beforeEach: () => void mocked(listSettings).mockReturnValue(new Promise(() => undefined)) };
