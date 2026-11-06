import type { MailDomain, MailMessage, MailMessagePage, MailSettings, MailStatus, MailTemplate, Mailbox } from "../api";

const hoursAgo = (hours: number) => new Date(Date.now() - hours * 3_600_000).toISOString();

export const mailSettings: MailSettings = {
	inboundEnabled: true,
	inboundPort: 25,
	hostname: "mail.flixer.example",
	maxMessageMb: 10,
	outboundEnabled: true,
	relayFallback: false,
	noreplyAddress: "noreply@flixer.example",
	noreplyName: "Flixer",
	userAddressesEnabled: true,
	userAddressMode: "username",
	userAddressDomain: "flixer.example",
};

export const mailStatus: MailStatus = {
	inbound: { listening: true, port: 25, error: null },
	outboundReady: true,
	sender: "noreply@flixer.example",
	domains: { total: 2, verified: 1 },
	userAddressesEnabled: true,
};

export const mailDomains: MailDomain[] = [
	{
		id: "dom-1",
		domain: "flixer.example",
		allowSubdomains: false,
		verified: true,
		verifiedAt: hoursAgo(72),
		dkimSelector: "flixer1",
		checks: { mx: { ok: true, detail: "MX points to mail.flixer.example" }, spf: { ok: true, detail: "SPF record found" } },
		lastCheckedAt: hoursAgo(1),
		records: [
			{ purpose: "mx", type: "MX", name: "flixer.example", value: "mail.flixer.example", priority: 10, required: true, note: "Routes inbound mail to this server." },
			{ purpose: "spf", type: "TXT", name: "flixer.example", value: "v=spf1 mx -all", required: true, note: "Authorises this server to send mail." },
		],
		createdAt: hoursAgo(100),
	},
	{
		id: "dom-2",
		domain: "friends.example",
		allowSubdomains: true,
		verified: false,
		verifiedAt: null,
		dkimSelector: "flixer1",
		checks: { ownership: { ok: false, detail: "TXT record not found" } },
		lastCheckedAt: hoursAgo(2),
		records: [
			{ purpose: "ownership", type: "TXT", name: "_flixer.friends.example", value: "flixer-verify=abc123", required: true, note: "Proves you own this domain." },
			{ purpose: "dkim", type: "TXT", name: "flixer1._domainkey.friends.example", value: "v=DKIM1; k=rsa; p=MIIBIjANBgkq", required: false, note: "Signs outgoing mail." },
		],
		createdAt: hoursAgo(24),
	},
];

export const mailboxes: Mailbox[] = [
	{ id: "mb-1", address: "noreply@flixer.example", kind: "system", displayName: "Flixer", userId: null, enabled: true, createdAt: hoursAgo(200), received: 0, sent: 412, unread: 0 },
	{ id: "mb-2", address: "support@flixer.example", kind: "inbox", displayName: "Support", userId: null, enabled: true, createdAt: hoursAgo(150), received: 38, sent: 12, unread: 3 },
	{ id: "mb-3", address: "alice@flixer.example", kind: "user", displayName: "Alice", userId: "u-1", enabled: false, createdAt: hoursAgo(90), username: "alice", received: 5, sent: 1, unread: 0 },
];

export const mailMessages: MailMessagePage = {
	total: 2,
	page: 1,
	limit: 30,
	items: [
		{ id: "msg-1", mailboxId: "mb-2", direction: "inbound", status: "received", from: "bob@example.com", fromName: "Bob", to: ["support@flixer.example"], subject: "Cannot play Severance S02E03", preview: "Hi, the episode stalls at 40%...", hasAttachments: true, read: false, createdAt: hoursAgo(1) },
		{ id: "msg-2", mailboxId: "mb-2", direction: "inbound", status: "received", from: "carol@example.com", fromName: null, to: ["support@flixer.example"], subject: "Invite request", preview: "Could I get an invite please?", hasAttachments: false, read: true, createdAt: hoursAgo(20) },
	],
};

export const mailMessage: MailMessage = {
	...mailMessages.items[0],
	text: "Hi,\n\nthe episode stalls at 40% every time.\n\nBob",
	html: "<p>Hi,</p><p>the episode stalls at <b>40%</b> every time.</p><p>Bob</p>",
	messageId: "<abc@example.com>",
	authResults: { spf: "pass", dkim: "pass", dmarc: "none" },
	remoteAddress: "203.0.113.7",
	attempts: 0,
	lastError: null,
	sentAt: null,
	attachments: [{ id: "att-1", filename: "screenshot.png", contentType: "image/png", size: 182_340 }],
};

export const mailTemplates: MailTemplate[] = [
	{
		name: "welcome",
		label: "Welcome",
		description: "Sent after a new account is created.",
		subject: "Welcome to Flixer, {{displayName}}",
		html: "<p>Hello {{displayName}},</p><p>Welcome aboard!</p>",
		text: "Hello {{displayName}},\n\nWelcome aboard!",
		builtin: true,
		customized: false,
		variables: ["displayName"],
		updatedAt: null,
	},
	{
		name: "invoice",
		label: "Invoice",
		description: "Receipt sent after a successful payment.",
		subject: "Your Flixer receipt",
		html: "<p>Thanks for your payment.</p>",
		text: "Thanks for your payment.",
		builtin: false,
		customized: true,
		variables: ["displayName", "amount"],
		updatedAt: hoursAgo(30),
	},
];
