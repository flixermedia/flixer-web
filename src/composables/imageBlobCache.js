import { ACCESS_TOKEN_KEY, AUTH_TOKEN_CHANGED_EVENT } from '../api/client';
const MAX_CACHE_BYTES = 32 * 1024 * 1024;
const MAX_CACHE_ENTRIES = 256;
const UNVERSIONED_TTL_MS = 60_000;
const cache = new Map();
const pending = new Map();
let cachedBytes = 0;
let generation = 0;
function remember(key, blob, expiresAt) {
    if (blob.size > MAX_CACHE_BYTES)
        return;
    const previous = cache.get(key);
    if (previous)
        cachedBytes -= previous.blob.size;
    cache.delete(key);
    cache.set(key, { blob, expiresAt });
    cachedBytes += blob.size;
    while (cachedBytes > MAX_CACHE_BYTES || cache.size > MAX_CACHE_ENTRIES) {
        const oldestKey = cache.keys().next().value;
        if (oldestKey === undefined)
            break;
        cachedBytes -= cache.get(oldestKey)?.blob.size ?? 0;
        cache.delete(oldestKey);
    }
}
export function clearImageBlobCache() {
    generation++;
    cache.clear();
    pending.clear();
    cachedBytes = 0;
}
export function fetchCachedImageBlob(key, fetcher, version) {
    const cached = cache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
        cache.delete(key);
        cache.set(key, cached);
        return Promise.resolve(cached.blob);
    }
    if (cached) {
        cachedBytes -= cached.blob.size;
        cache.delete(key);
    }
    const existing = pending.get(key);
    if (existing)
        return existing;
    const cacheGeneration = generation;
    const expiresAt = version ? Number.POSITIVE_INFINITY : Date.now() + UNVERSIONED_TTL_MS;
    const request = fetcher()
        .then((blob) => {
        if (cacheGeneration === generation)
            remember(key, blob, expiresAt);
        return blob;
    })
        .finally(() => {
        if (pending.get(key) === request)
            pending.delete(key);
    });
    pending.set(key, request);
    return request;
}
if (typeof window !== 'undefined') {
    window.addEventListener(AUTH_TOKEN_CHANGED_EVENT, clearImageBlobCache);
    window.addEventListener('storage', (event) => {
        if (event.key === ACCESS_TOKEN_KEY)
            clearImageBlobCache();
    });
}
