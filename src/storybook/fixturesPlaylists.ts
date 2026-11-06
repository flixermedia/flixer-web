import type { PlaylistSummary } from "../api";

export function playlistFixture(id: string, name: string, trackCount: number): PlaylistSummary {
	return { id, name, description: null, isPublic: false, trackCount, durationSeconds: trackCount * 210, cover: null, owner: { username: "alex", displayName: "Alex", avatarUrl: null }, updatedAt: "2025-01-10T12:00:00.000Z" };
}

export const playlistsFixture = [playlistFixture("p1", "Road trip", 24), playlistFixture("p2", "Focus", 58), playlistFixture("p3", "Movie night", 7)];
