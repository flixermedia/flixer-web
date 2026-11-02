/** Each top-level tab holds one or more pages. The first page is the tab's own; the others appear in its dropdown. */
export const ADMIN_TABS = {
    dashboard: ['overview'],
    guide: ['guide'],
    library: ['libraries', 'tasks', 'media', 'transcoding'],
    providers: ['metadata', 'subtitles', 'themes'],
    requests: ['requests'],
    notifications: ['notifications', 'smtp'],
    apikeys: ['apikeys'],
    plugins: ['plugins'],
    settings: ['server', 'users', 'networking', 'search', 'updates', 'backups'],
};
export const ADMIN_TAB_IDS = Object.keys(ADMIN_TABS);
export function pagesOf(tab) {
    return ADMIN_TABS[tab];
}
/** Where links from before the dropdown navigation (a whole-page tab, or a single page of one) now lead. */
const LEGACY = {
    overview: { tab: 'dashboard', page: 'overview' },
    streams: { tab: 'dashboard', page: 'overview' },
    logs: { tab: 'dashboard', page: 'overview' },
    libraries: { tab: 'library', page: 'libraries' },
    indexer: { tab: 'library', page: 'tasks' },
    tasks: { tab: 'library', page: 'tasks' },
    media: { tab: 'library', page: 'media' },
    transcoding: { tab: 'library', page: 'transcoding' },
    users: { tab: 'settings', page: 'users' },
    devices: { tab: 'settings', page: 'users' },
    general: { tab: 'settings', page: 'server' },
    updates: { tab: 'settings', page: 'updates' },
    backups: { tab: 'settings', page: 'backups' },
    plugins: { tab: 'plugins', page: 'plugins' },
};
function text(value) {
    return Array.isArray(value) ? text(value[0]) : typeof value === 'string' ? value : '';
}
/** Works out the tab and page from the `tab` and `page` query values, falling back to the dashboard. */
export function resolveAdminLocation(tabQuery, pageQuery) {
    const tab = text(tabQuery);
    const page = text(pageQuery);
    if (ADMIN_TAB_IDS.includes(tab)) {
        const id = tab;
        const pages = pagesOf(id);
        return { tab: id, page: (pages.includes(page) ? page : pages[0]) };
    }
    return LEGACY[tab] ?? { tab: 'dashboard', page: 'overview' };
}
/** The tab a page lives in. */
export function tabOf(page) {
    return ADMIN_TAB_IDS.find((tab) => ADMIN_TABS[tab].includes(page)) ?? null;
}
/** The query that opens a page; the default page of a tab needs no `page`. */
export function adminQuery(tab, page) {
    return page && page !== pagesOf(tab)[0] ? { tab, page } : { tab };
}
