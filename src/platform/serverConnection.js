import { Capacitor } from '@capacitor/core';
export const NATIVE_SERVER_URL_KEY = 'flixer.nativeServerUrl';
export function isNativeApp() {
    return Capacitor.isNativePlatform();
}
export function getNativeServerUrl() {
    return localStorage.getItem(NATIVE_SERVER_URL_KEY) ?? '';
}
export function normalizeNativeServerUrl(value) {
    let url;
    try {
        url = new URL(value.trim());
    }
    catch {
        throw new Error('invalid');
    }
    if (url.protocol !== 'https:' || !url.hostname || url.username || url.password || url.search || url.hash) {
        throw new Error('invalid');
    }
    let pathname = url.pathname.replace(/\/+$/, '');
    if (pathname.endsWith('/api'))
        pathname = pathname.slice(0, -4);
    return `${url.origin}${pathname}`;
}
export function saveNativeServerUrl(value) {
    const normalized = normalizeNativeServerUrl(value);
    const changed = normalized !== getNativeServerUrl();
    localStorage.setItem(NATIVE_SERVER_URL_KEY, normalized);
    return changed;
}
export function forgetNativeServerUrl() {
    localStorage.removeItem(NATIVE_SERVER_URL_KEY);
}
export function getApiBaseUrl() {
    if (import.meta.env.DEV)
        return '/api';
    if (isNativeApp()) {
        const serverUrl = getNativeServerUrl();
        return serverUrl ? `${serverUrl}/api` : '/api';
    }
    return import.meta.env.VITE_API_BASE_URL || '/api';
}
export function resolveServerResourceUrl(path) {
    if (import.meta.env.DEV) {
        const url = new URL(path, window.location.origin);
        const proxiedPath = `${url.pathname}${url.search}`;
        return isNativeApp() ? new URL(proxiedPath, window.location.origin).toString() : proxiedPath;
    }
    if (!isNativeApp() || /^https?:\/\//i.test(path))
        return path;
    const serverUrl = getNativeServerUrl();
    if (!serverUrl)
        return path;
    return `${serverUrl}/${path.replace(/^\/+/, '')}`;
}
export function buildApiWebSocketUrl(path) {
    const base = getApiBaseUrl();
    const baseUrl = /^https?:\/\//i.test(base) ? new URL(base) : new URL(base, window.location.origin);
    baseUrl.pathname = `${baseUrl.pathname.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
    baseUrl.protocol = baseUrl.protocol === 'https:' ? 'wss:' : 'ws:';
    return baseUrl.toString();
}
