import { ref } from "vue";
import type { SocialItem } from "flixer-api-client";
import { addVideoQueueItem, getVideoQueue, removeVideoQueueItem, reorderVideoQueue } from "../api/userMedia";
import { AUTH_INVALID_EVENT, AUTH_TOKEN_CHANGED_EVENT } from "../api/client";

const items = ref<SocialItem[]>([]);
let generation = 0;

if (typeof window !== "undefined") {
	for (const event of [AUTH_INVALID_EVENT, AUTH_TOKEN_CHANGED_EVENT]) {
		window.addEventListener(event, () => {
			generation++;
			items.value = [];
		});
	}
}

async function load() {
	const currentGeneration = generation;
	const result = await getVideoQueue();
	if (currentGeneration === generation) items.value = result;
}

async function add(itemId: string) {
	const currentGeneration = generation;
	await addVideoQueueItem(itemId);
	if (currentGeneration === generation) await load();
}

async function remove(itemId: string) {
	const currentGeneration = generation;
	await removeVideoQueueItem(itemId);
	if (currentGeneration !== generation) return false;
	items.value = items.value.filter((item) => item.id !== itemId);
	return true;
}

async function reorder(itemIds: string[]) {
	const currentGeneration = generation;
	await reorderVideoQueue(itemIds);
	if (currentGeneration === generation) await load();
}

export function useVideoQueue() {
	return { items, load, add, remove, reorder };
}
