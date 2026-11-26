/** Each top-level tab holds one or more pages. The first page is the tab's own; the others appear in its dropdown. */
export const ADMIN_TABS = {
	dashboard: ["overview"],
	library: ["libraries", "media", "tasks", "duplicateSuggestions", "transcoding", "search"],
	guide: ["guide"],
	providers: ["metadata", "subtitles", "themes", "trailerCache"],
	users: ["users", "invites", "apikeys", "oauth"],
	requests: ["requests"],
	issues: ["tickets", "issueReports"],
	analytics: ["analyticsOverview", "analyticsVideo", "analyticsMusic", "analyticsHistory", "analyticsAdvertising", "analyticsGuide", "analyticsPayments"],
	logging: ["logging"],
	notifications: ["notifications", "smtp"],
	mail: ["mailOverview", "mailDomains", "mailInboxes", "mailMessages", "mailTemplates"],
	communications: ["chatSettings", "callSettings"],
	videoPlayer: ["playerSettings", "widevine"],
	payments: ["payments", "paymentsCatalog", "paymentsSales"],
	advertising: ["advertisements"],
	plugins: ["plugins"],
	cloud: ["cloud", "prioritySupport"],
	settings: ["server", "appearance", "ai", "webhooks", "networking", "updates", "backups"],
} as const;

export type AdminTabId = keyof typeof ADMIN_TABS;
export type AdminPageId = (typeof ADMIN_TABS)[AdminTabId][number];

export interface AdminLocation {
	tab: AdminTabId;
	page: AdminPageId;
}

export interface AdminTabItem {
	id: AdminTabId;
	label: string;
	pages: { id: AdminPageId; label: string }[];
}

export const ADMIN_TAB_IDS = Object.keys(ADMIN_TABS) as AdminTabId[];

export function pagesOf(tab: AdminTabId): readonly AdminPageId[] {
	return ADMIN_TABS[tab];
}

/** Where links from before the dropdown navigation (a whole-page tab, or a single page of one) now lead. */
const LEGACY: Record<string, AdminLocation> = {
	overview: { tab: "dashboard", page: "overview" },
	streams: { tab: "dashboard", page: "overview" },
	logs: { tab: "logging", page: "logging" },
	libraries: { tab: "library", page: "libraries" },
	indexer: { tab: "library", page: "tasks" },
	tasks: { tab: "library", page: "tasks" },
	media: { tab: "library", page: "media" },
	transcoding: { tab: "library", page: "transcoding" },
	search: { tab: "library", page: "search" },
	users: { tab: "users", page: "users" },
	devices: { tab: "users", page: "users" },
	invites: { tab: "users", page: "invites" },
	apikeys: { tab: "users", page: "apikeys" },
	oauth: { tab: "users", page: "oauth" },
	general: { tab: "settings", page: "server" },
	updates: { tab: "settings", page: "updates" },
	backups: { tab: "settings", page: "backups" },
	plugins: { tab: "plugins", page: "plugins" },
	tickets: { tab: "issues", page: "tickets" },
	issueReports: { tab: "issues", page: "issueReports" },
	mail: { tab: "mail", page: "mailOverview" },
};

function text(value: unknown): string {
	return Array.isArray(value) ? text(value[0]) : typeof value === "string" ? value : "";
}

/** Works out the tab and page from the `tab` and `page` query values, falling back to the dashboard. */
export function resolveAdminLocation(tabQuery: unknown, pageQuery?: unknown): AdminLocation {
	const tab = text(tabQuery);
	const page = text(pageQuery);
	if (tab === "requests" && page === "tickets") return { tab: "issues", page: "tickets" };
	if (tab === "settings" && page === "invites") return { tab: "users", page: "invites" };
	if (tab === "settings" && page === "users") return { tab: "users", page: "users" };
	if (tab === "settings" && page === "search") return { tab: "library", page: "search" };
	if (tab === "settings" && page === "issueReports") return { tab: "issues", page: "issueReports" };
	if (tab === "settings" && page === "chatEncryption") return { tab: "communications", page: "chatSettings" };
	if (tab === "settings" && page === "calls") return { tab: "communications", page: "callSettings" };
	if (tab === "library" && page === "advertisements") return { tab: "advertising", page: "advertisements" };
	if (tab === "drm" || (tab === "videoPlayer" && page === "drmTesting")) return { tab: "videoPlayer", page: "widevine" };
	if ((ADMIN_TAB_IDS as string[]).includes(tab)) {
		const id = tab as AdminTabId;
		const pages = pagesOf(id) as readonly string[];
		return { tab: id, page: (pages.includes(page) ? page : pages[0]) as AdminPageId };
	}
	return LEGACY[tab] ?? { tab: "dashboard", page: "overview" };
}

/** The tab a page lives in. */
export function tabOf(page: string): AdminTabId | null {
	return ADMIN_TAB_IDS.find((tab) => (ADMIN_TABS[tab] as readonly string[]).includes(page)) ?? null;
}

/** The query that opens a page; the default page of a tab needs no `page`. */
export function adminQuery(tab: AdminTabId, page?: AdminPageId): Record<string, string> {
	return page && page !== pagesOf(tab)[0] ? { tab, page } : { tab };
}
