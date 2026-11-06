import type { AccessMe, AppNotification, MailMe, PartySnapshot, UserProfile } from "../api";

export const userFixture: UserProfile = {
	id: "u1",
	username: "alex",
	displayName: "Alex Rivera",
	email: "alex@example.com",
	emailVerified: true,
	pendingEmail: null,
	passkeyRequired: false,
	avatarUrl: null,
	role: "user",
	createdAt: "2024-03-01T10:00:00.000Z",
};

export const adminFixture: UserProfile = { ...userFixture, id: "u0", username: "admin", displayName: "Admin", role: "admin" };

export const accessFixture: AccessMe = { enforced: false, hasPin: false, unlockedUntil: null, displayMode: "locked", maxAge: null, requireRequestApproval: false, schedule: { allowed: true, nextAllowedAt: null } };

export const mailMeFixture: MailMe = { enabled: true, address: "alex@flixer.example", unread: 3 };

export const notificationsFixture: AppNotification[] = [
	{ id: "n1", kind: "new_media", title: "New episode available", body: "Season 2, Episode 4 was added.", url: "/", read: false, createdAt: new Date(Date.now() - 5 * 60_000).toISOString() },
	{ id: "n2", kind: "friend_request", title: "Sam Chen wants to be friends", body: "Accept to share playlists.", url: "/u/sam", read: false, createdAt: new Date(Date.now() - 3 * 3600_000).toISOString() },
	{ id: "n3", kind: "message", title: "New message", body: "You have a new mail.", url: "/chat", read: true, createdAt: new Date(Date.now() - 26 * 3600_000).toISOString() },
];

const person = (id: string, username: string, displayName: string) => ({ id, username, displayName, avatarUrl: null });

export const partyFixture: PartySnapshot = {
	id: "party1",
	kind: "video",
	visibility: "friends",
	host: person("u0", "admin", "Admin"),
	item: { id: "movie1", type: "movie", title: "Blade Runner 2049", subtitle: null, year: 2017, imageItemId: "movie1", imageIndex: 0, imageUpdatedAt: "2025-01-01T00:00:00.000Z", updatedAt: "2025-01-01T00:00:00.000Z" },
	playing: true,
	position: 120,
	at: Date.now(),
	version: 1,
	playbackRate: 1,
	members: [person("u0", "admin", "Admin"), person("u1", "alex", "Alex Rivera"), person("u2", "sam", "Sam Chen")],
};
