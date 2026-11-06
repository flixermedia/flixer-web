import type { FriendLists, MySocialProfile, Passkey, ServerSetting, UserProfile } from "../api";

export const profileFixture: UserProfile = {
	id: "user-1",
	username: "alex",
	displayName: "Alex Morgan",
	email: "alex@example.com",
	emailVerified: true,
	pendingEmail: null,
	passkeyRequired: false,
	avatarUrl: null,
	role: "admin",
	createdAt: "2025-01-15T10:00:00.000Z",
};

export const passkeysFixture: Passkey[] = [
	{ id: "pk-1", name: "MacBook Touch ID", deviceType: "multiDevice", backedUp: true, transports: ["internal"], createdAt: "2025-03-02T09:30:00.000Z", lastUsedAt: "2025-10-20T18:12:00.000Z" },
	{ id: "pk-2", name: "YubiKey 5C", deviceType: "singleDevice", backedUp: false, transports: ["usb", "nfc"], createdAt: "2025-06-11T14:00:00.000Z", lastUsedAt: null },
];

export const serverSettingsFixture: ServerSetting[] = [
	{ key: "registration_enabled", value: true, isPublic: true, updatedAt: "2025-09-01T12:00:00.000Z" },
	{ key: "server_name", value: "Living Room Flixer", isPublic: true, updatedAt: "2025-09-01T12:00:00.000Z" },
	{ key: "server_address", value: "https://flixer.example.com", isPublic: true, updatedAt: "2025-09-01T12:00:00.000Z" },
	{ key: "cache_path", value: "/var/cache/flixer", isPublic: false, updatedAt: "2025-09-01T12:00:00.000Z" },
	{ key: "logs_path", value: "/var/log/flixer", isPublic: false, updatedAt: "2025-09-01T12:00:00.000Z" },
	{ key: "metadata_path", value: null, isPublic: false, updatedAt: "2025-09-01T12:00:00.000Z" },
];

export const friendsFixture: FriendLists = {
	friends: [{ id: "u-2", username: "sam", displayName: "Sam Rivera", avatarUrl: null }],
	incoming: [{ id: "u-3", username: "jordan", displayName: "Jordan Lee", avatarUrl: null }],
	outgoing: [{ id: "u-4", username: "casey", displayName: "Casey Kim", avatarUrl: null }],
};

export const mySocialProfileFixture: MySocialProfile = {
	username: "alex",
	displayName: "Alex Morgan",
	avatarUrl: null,
	joinedAt: "2025-01-15T10:00:00.000Z",
	isSelf: true,
	hidden: false,
	visibility: "public",
	friendship: "self",
	isFriend: false,
	nowPlaying: null,
	recentlyWatched: [],
	recentlyListened: [],
	favorites: [],
	playlists: [],
} as unknown as MySocialProfile;

/** A small inline SVG standing in for artwork fetched from the API. */
export function artworkBlob(color = "#6d28d9"): Blob {
	return new Blob([`<svg xmlns="http://www.w3.org/2000/svg" width="300" height="450"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${color}"/><stop offset="1" stop-color="#0f172a"/></linearGradient></defs><rect width="300" height="450" fill="url(#g)"/></svg>`], { type: "image/svg+xml" });
}
