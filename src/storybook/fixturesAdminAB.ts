import type { AdminUser, MediaLibrary, ServerSetting } from "../api";

export const serverSettings: ServerSetting[] = [
	{ key: "server_name", value: "Flixer Home", isPublic: true, updatedAt: "2026-10-01T10:00:00.000Z" },
	{ key: "login_banner", value: "Welcome back!", isPublic: true, updatedAt: "2026-10-01T10:00:00.000Z" },
	{ key: "sentry_enabled", value: true, isPublic: false, updatedAt: "2026-10-01T10:00:00.000Z" },
	{ key: "sentry_web_enabled", value: true, isPublic: false, updatedAt: "2026-10-01T10:00:00.000Z" },
	{ key: "sentry_web_dsn", value: "https://key@o0.ingest.sentry.io/1", isPublic: false, updatedAt: "2026-10-01T10:00:00.000Z" },
	{ key: "calls_enabled", value: true, isPublic: true, updatedAt: "2026-10-01T10:00:00.000Z" },
	{ key: "smtp_host", value: "smtp.example.com", isPublic: false, updatedAt: "2026-10-01T10:00:00.000Z" },
	{ key: "smtp_port", value: 587, isPublic: false, updatedAt: "2026-10-01T10:00:00.000Z" },
	{ key: "smtp_user", value: "flixer@example.com", isPublic: false, updatedAt: "2026-10-01T10:00:00.000Z" },
	{ key: "smtp_from", value: "Flixer <flixer@example.com>", isPublic: false, updatedAt: "2026-10-01T10:00:00.000Z" },
	{ key: "smtp_password", value: "********", isPublic: false, updatedAt: "2026-10-01T10:00:00.000Z" },
];

const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString();

export const adminUsers: AdminUser[] = [
	{ id: "u1", username: "alice", displayName: "Alice Admin", email: "alice@example.com", emailVerified: true, role: "admin", disabled: false, passkeys: 2, activeSessions: 2, lastActiveAt: daysAgo(0), createdAt: daysAgo(400), avatarUrl: null, current: true },
	{ id: "u2", username: "bob", displayName: "Bob", email: "bob@example.com", emailVerified: false, role: "user", disabled: false, passkeys: 0, activeSessions: 1, lastActiveAt: daysAgo(1), createdAt: daysAgo(200), avatarUrl: null, current: false },
	{ id: "u3", username: "carol", displayName: "Carol", email: null, emailVerified: false, role: "user", disabled: true, passkeys: 1, activeSessions: 0, lastActiveAt: daysAgo(60), createdAt: daysAgo(120), avatarUrl: null, current: false },
];

export const mediaLibraries: MediaLibrary[] = [
	{ id: "lib-movies", name: "Movies", type: "movies", imageStorage: "cache", createdAt: "2026-01-10T10:00:00.000Z", folders: [{ rootName: "Media", location: "/media/movies", available: true, rootId: "root-media", path: "movies" }] },
	{
		id: "lib-shows",
		name: "TV Shows",
		type: "tvshows",
		imageStorage: "alongside",
		createdAt: "2026-01-10T10:05:00.000Z",
		folders: [
			{ rootName: "Media", location: "/media/shows", available: true, rootId: "root-media", path: "shows" },
			{ rootName: "Archive", location: "/archive/shows", available: false, rootId: "root-archive", path: "shows" },
		],
	},
	{ id: "lib-music", name: "Music", type: "music", imageStorage: "cache", createdAt: "2026-02-01T09:00:00.000Z", folders: [{ rootName: "Music", location: "/music", available: true, rootId: "root-music", path: "" }] },
];
