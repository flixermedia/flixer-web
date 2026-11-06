import type { PublicProfileSummary } from "../api";

export function profileFixture(username: string, displayName: string): PublicProfileSummary {
	return { username, displayName, avatarUrl: null, joinedAt: "2024-03-01T10:00:00.000Z", favoriteCount: 12, playlistCount: 3, playCount: 240, nowPlaying: null };
}

export const profilesFixture = [profileFixture("alex", "Alex Rivera"), profileFixture("sam", "Sam Chen"), profileFixture("jo", "Jo Park"), profileFixture("mika", "Mika Tanaka")];
