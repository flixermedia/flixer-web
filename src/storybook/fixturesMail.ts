import type { MailMessage, MailMessageSummary } from "../api";

export const mailSummaries: MailMessageSummary[] = [
	{ id: "m1", mailboxId: "box1", direction: "inbound", status: "received", from: "noreply@flixer.example", fromName: "Flixer", to: ["alex@flixer.example"], subject: "Welcome to Flixer", preview: "Thanks for joining…", hasAttachments: false, read: false, createdAt: new Date().toISOString() },
	{ id: "m2", mailboxId: "box1", direction: "inbound", status: "received", from: "billing@flixer.example", fromName: "Billing", to: ["alex@flixer.example"], subject: "Your receipt", preview: "Receipt attached.", hasAttachments: true, read: true, createdAt: "2025-01-04T09:30:00.000Z" },
	{ id: "m3", mailboxId: "box1", direction: "inbound", status: "received", from: "friend@example.com", fromName: null, to: ["alex@flixer.example"], subject: "", preview: "", hasAttachments: false, read: true, createdAt: "2024-12-20T18:00:00.000Z" },
];

export const mailMessage: MailMessage = {
	...mailSummaries[1],
	text: "Hello Alex,\n\nYour receipt for January is attached.\n\nThanks!",
	html: "<h2>Your receipt</h2><p>Hello Alex, your receipt for January is attached.</p>",
	messageId: "<abc123@flixer.example>",
	authResults: { spf: "pass", dkim: "pass", dmarc: "fail" },
	remoteAddress: "203.0.113.7",
	attempts: 0,
	lastError: null,
	sentAt: null,
	attachments: [{ id: "a1", filename: "receipt-january.pdf", contentType: "application/pdf", size: 48213 }],
};
