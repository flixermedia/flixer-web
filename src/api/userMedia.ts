import type { SocialItem } from "flixer-api-client";
import { api } from "./client";

export interface PlaybackHistoryEntry {
	id: string;
	kind: "video" | "music" | "live";
	watchedSeconds: number;
	startedAt: string;
	updatedAt: string;
	item: SocialItem | null;
	channelName: string | null;
}

export interface VideoCollection {
	id: string;
	name: string;
	description: string | null;
	isPublic: boolean;
	itemCount: number;
	visibleItemCount?: number;
	createdAt: string;
	updatedAt: string;
	cover?: CollectionCover | null;
}

export interface CollectionCover {
	itemId: string;
	index: number;
	version: string;
}

export interface AutomaticCollection {
	id: string;
	name: string;
	itemCount: number;
	cover: CollectionCover | null;
}

export async function getAutomaticCollections(): Promise<AutomaticCollection[]> {
	return (await api.get<{ collections: AutomaticCollection[] }>("/user-media/automatic-collections")).data.collections;
}

export async function getAutomaticCollection(id: string): Promise<Omit<AutomaticCollection, "cover"> & { items: SocialItem[] }> {
	return (await api.get(`/user-media/automatic-collections/${encodeURIComponent(id)}`)).data;
}

export async function getPlaybackHistory(offset = 0, limit = 25): Promise<{ entries: PlaybackHistoryEntry[]; hasMore: boolean }> {
	return (await api.get("/user-media/history", { params: { offset, limit } })).data;
}

export async function deletePlaybackHistory(id?: string): Promise<void> {
	await api.delete(id ? `/user-media/history/${encodeURIComponent(id)}` : "/user-media/history");
}

export async function getWatchLater(): Promise<SocialItem[]> {
	return (await api.get<{ items: SocialItem[] }>("/user-media/watch-later")).data.items;
}

export async function getWatchLaterIds(): Promise<string[]> {
	return (await api.get<{ ids: string[] }>("/user-media/watch-later/ids")).data.ids;
}

export async function setWatchLater(itemId: string, added: boolean): Promise<void> {
	const url = `/user-media/watch-later/${encodeURIComponent(itemId)}`;
	if (added) await api.put(url);
	else await api.delete(url);
}

export async function getVideoQueue(): Promise<SocialItem[]> {
	return (await api.get<{ items: SocialItem[] }>("/user-media/queue")).data.items;
}

export async function addVideoQueueItem(itemId: string): Promise<void> {
	await api.post("/user-media/queue", { itemId });
}

export async function removeVideoQueueItem(itemId: string): Promise<void> {
	await api.delete(`/user-media/queue/${encodeURIComponent(itemId)}`);
}

export async function clearVideoQueue(): Promise<void> {
	await api.delete("/user-media/queue");
}

export async function reorderVideoQueue(itemIds: string[]): Promise<void> {
	await api.put("/user-media/queue/order", { itemIds });
}

export async function getVideoCollections(): Promise<VideoCollection[]> {
	return (await api.get<{ collections: VideoCollection[] }>("/user-media/collections")).data.collections;
}

export async function getVideoCollection(id: string): Promise<VideoCollection & { isOwner: boolean; items: SocialItem[] }> {
	return (await api.get(`/user-media/collections/${encodeURIComponent(id)}`)).data;
}

export async function createVideoCollection(input: { name: string; description?: string; isPublic?: boolean }): Promise<VideoCollection> {
	return (await api.post("/user-media/collections", input)).data;
}

export async function updateVideoCollection(id: string, input: { name?: string; description?: string | null; isPublic?: boolean }): Promise<VideoCollection> {
	return (await api.patch(`/user-media/collections/${encodeURIComponent(id)}`, input)).data;
}

export async function deleteVideoCollection(id: string): Promise<void> {
	await api.delete(`/user-media/collections/${encodeURIComponent(id)}`);
}

export async function addVideoCollectionItem(id: string, itemId: string): Promise<void> {
	await api.post(`/user-media/collections/${encodeURIComponent(id)}/items`, { itemId });
}

export async function removeVideoCollectionItem(id: string, itemId: string): Promise<void> {
	await api.delete(`/user-media/collections/${encodeURIComponent(id)}/items/${encodeURIComponent(itemId)}`);
}

export async function reorderVideoCollection(id: string, itemIds: string[]): Promise<void> {
	await api.put(`/user-media/collections/${encodeURIComponent(id)}/order`, { itemIds });
}

export async function setRecommendationFeedback(itemId: string, feedback: "dismiss" | "more_like_this" | "less_like_this"): Promise<void> {
	await api.post(`/recommendations/${encodeURIComponent(itemId)}/feedback`, { feedback });
}

export async function getDismissedRecommendations(): Promise<SocialItem[]> {
	return (await api.get<{ items: SocialItem[] }>("/recommendations/feedback")).data.items;
}

export async function clearRecommendationFeedback(itemId: string): Promise<void> {
	await api.delete(`/recommendations/${encodeURIComponent(itemId)}/feedback`);
}
