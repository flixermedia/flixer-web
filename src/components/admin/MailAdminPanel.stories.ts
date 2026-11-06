import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { mocked } from "storybook/test";
import { getAdminMailMessage, getMailSettings, getMailStatus, getMailTemplate, listAdminMailMessages, listMailboxes, listMailDomains, listMailTemplates, previewMailTemplate } from "../../api";
import { mailboxes, mailDomains, mailMessage, mailMessages, mailSettings, mailStatus, mailTemplates } from "../../storybook/fixturesMailAdmin";
import MailAdminPanel from "./MailAdminPanel.vue";

const meta = {
	title: "Admin/MailAdminPanel",
	component: MailAdminPanel,
	tags: ["autodocs"],
	parameters: { layout: "padded" },
	argTypes: { screen: { control: "inline-radio", options: ["overview", "domains", "inboxes", "messages", "templates"] } },
	beforeEach: () => {
		mocked(getMailStatus).mockResolvedValue(mailStatus);
		mocked(getMailSettings).mockResolvedValue(mailSettings);
		mocked(listMailDomains).mockResolvedValue(mailDomains);
		mocked(listMailboxes).mockResolvedValue(mailboxes);
		mocked(listAdminMailMessages).mockResolvedValue(mailMessages);
		mocked(getAdminMailMessage).mockResolvedValue(mailMessage);
		mocked(listMailTemplates).mockResolvedValue(mailTemplates);
		mocked(getMailTemplate).mockImplementation(async (name) => mailTemplates.find((template) => template.name === name) ?? mailTemplates[0]);
		mocked(previewMailTemplate).mockResolvedValue({ subject: "Welcome to Flixer, Alice", html: "<p>Hello Alice,</p>", text: "Hello Alice,", variables: ["displayName"] });
	},
} satisfies Meta<typeof MailAdminPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = { args: { screen: "overview" } };
export const Domains: Story = { args: { screen: "domains" } };
export const Inboxes: Story = { args: { screen: "inboxes" } };
export const Messages: Story = { args: { screen: "messages" } };
export const Templates: Story = { args: { screen: "templates" } };
export const LoadError: Story = {
	args: { screen: "overview" },
	beforeEach: () => {
		mocked(getMailStatus).mockRejectedValue(new Error("Mail service unavailable"));
	},
};
