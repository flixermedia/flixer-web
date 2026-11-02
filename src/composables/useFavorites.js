import { ref } from 'vue';
import { addFavorite, getFavoriteIds, removeFavorite } from '../api';
import { catchError } from '../utils/catchError';
const favoriteIds = ref(new Set());
let loadPromise = null;
const revisions = new Map();
const operations = new Map();
async function load() {
    if (!loadPromise) {
        loadPromise = getFavoriteIds()
            .then(({ ids }) => {
            favoriteIds.value = new Set(ids);
        })
            .catch((error) => {
            loadPromise = null;
            throw error;
        });
    }
    return loadPromise;
}
async function toggle(itemId) {
    const wasFavorite = favoriteIds.value.has(itemId);
    const shouldFavorite = !wasFavorite;
    const revision = (revisions.get(itemId) ?? 0) + 1;
    revisions.set(itemId, revision);
    const next = new Set(favoriteIds.value);
    if (shouldFavorite)
        next.add(itemId);
    else
        next.delete(itemId);
    favoriteIds.value = next;
    const previous = operations.get(itemId) ?? Promise.resolve();
    const operation = previous
        .catch(() => undefined)
        .then(async () => {
        const [error] = await catchError(shouldFavorite ? addFavorite(itemId) : removeFavorite(itemId));
        if (error) {
            if (revisions.get(itemId) === revision) {
                const rolledBack = new Set(favoriteIds.value);
                if (wasFavorite)
                    rolledBack.add(itemId);
                else
                    rolledBack.delete(itemId);
                favoriteIds.value = rolledBack;
            }
            throw error;
        }
    });
    operations.set(itemId, operation);
    try {
        await operation;
    }
    finally {
        if (operations.get(itemId) === operation)
            operations.delete(itemId);
    }
}
export function useFavorites() {
    return { favoriteIds, load, toggle, isFavorite: (itemId) => favoriteIds.value.has(itemId) };
}
