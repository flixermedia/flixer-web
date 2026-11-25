import { api } from "../../api/client";

export type PageBlockType = "heading" | "text" | "image" | "auth" | "auth-field" | "auth-custom" | "auth-action" | "button" | "video" | "card" | "columns" | "hero" | "media-row";
export type AuthField = "username" | "password" | "email" | "displayName" | "submit" | "switch" | "passkey" | "quickConnect" | "providers" | "resend";
export type MediaRowSource = "continue" | "recent" | "library" | "collection";
export type PageAccess = "public" | "signed-in";
export interface PageBlockStyle {
	align?: "left" | "center" | "right";
	color?: string;
	background?: string;
	spacing?: "compact" | "normal" | "spacious";
	fontSize?: "sm" | "md" | "lg" | "xl";
	radius?: "none" | "sm" | "md" | "lg" | "full";
	shadow?: "none" | "sm" | "md" | "lg";
	opacity?: number;
}
export interface PagePosition {
	x: number;
	y: number;
	width: number;
	height?: number;
}
export function defaultPagePosition(blocks: PageBlock[], index: number, viewport: "desktop" | "mobile"): PagePosition {
	const y = blocks.slice(0, index).reduce((offset, block) => offset + (block.type === "auth" ? 950 : block.type === "hero" ? 320 : block.type === "media-row" ? 280 : 180), 0);
	return { x: 0, y: Math.min(5000, y), width: viewport === "desktop" ? 50 : 90 };
}
export interface PageBlock {
	id: string;
	type: PageBlockType;
	text: string;
	image: string | null;
	description?: string;
	buttonText?: string;
	href?: string;
	source?: MediaRowSource;
	sourceId?: string;
	field?: AuthField;
	allowedFields?: string[];
	style?: PageBlockStyle;
	columns?: PageBlock[][];
	position?: { desktop: PagePosition; mobile: PagePosition };
}
export interface PageContent {
	blocks: PageBlock[];
	layout?: "flow" | "free";
}
export interface PublishedPage extends PageContent {
	title: string;
	slug: string;
	access?: PageAccess;
}
export interface PageVersion {
	id: string;
	createdAt: string;
	content: PublishedPage;
}
export interface ScheduledPage {
	at: string;
	content: PublishedPage;
}
export interface PageSiteSettings {
	homePageId: string | null;
	navigationIds: string[];
}
export interface PageNavigationItem {
	title: string;
	slug: string;
}
export interface ReusablePageBlock {
	id: string;
	name: string;
	block: PageBlock;
}
export interface BuilderPage {
	id: string;
	title: string;
	slug: string;
	kind: "page" | "login";
	clusterId?: string | null;
	access?: PageAccess;
	draft: PageContent;
	published: PublishedPage | null;
	history?: PageVersion[];
	scheduled?: ScheduledPage | null;
}

export async function listBuilderPages(): Promise<BuilderPage[]> {
	return (await api.get<BuilderPage[]>("/admin/pages")).data;
}
export async function createBuilderPage(clusterId?: string): Promise<BuilderPage> {
	return (await api.post<BuilderPage>("/admin/pages", clusterId ? { clusterId } : undefined)).data;
}
export async function saveBuilderPage(page: BuilderPage): Promise<BuilderPage> {
	return (await api.put<BuilderPage>(`/admin/pages/${encodeURIComponent(page.id)}`, { title: page.title, slug: page.slug, access: page.access ?? "public", clusterId: page.clusterId ?? null, draft: page.draft })).data;
}
export async function publishBuilderPage(id: string): Promise<BuilderPage> {
	return (await api.post<BuilderPage>(`/admin/pages/${encodeURIComponent(id)}/publish`)).data;
}
export async function unpublishBuilderPage(id: string): Promise<BuilderPage> {
	return (await api.post<BuilderPage>(`/admin/pages/${encodeURIComponent(id)}/unpublish`)).data;
}
export async function scheduleBuilderPage(id: string, at: string): Promise<BuilderPage> {
	return (await api.post<BuilderPage>(`/admin/pages/${encodeURIComponent(id)}/schedule`, { at })).data;
}
export async function cancelBuilderSchedule(id: string): Promise<BuilderPage> {
	return (await api.delete<BuilderPage>(`/admin/pages/${encodeURIComponent(id)}/schedule`)).data;
}
export async function restoreBuilderVersion(id: string, versionId: string): Promise<BuilderPage> {
	return (await api.post<BuilderPage>(`/admin/pages/${encodeURIComponent(id)}/versions/${encodeURIComponent(versionId)}/restore`)).data;
}
export async function deleteBuilderPage(id: string): Promise<void> {
	await api.delete(`/admin/pages/${encodeURIComponent(id)}`);
}
export async function getPublishedPage(slug: string): Promise<PublishedPage> {
	return (await api.get<PublishedPage>(`/pages/${encodeURIComponent(slug)}`)).data;
}
export async function getPageSiteSettings(): Promise<PageSiteSettings> {
	return (await api.get<PageSiteSettings>("/admin/page-site")).data;
}
export async function savePageSiteSettings(settings: PageSiteSettings): Promise<PageSiteSettings> {
	return (await api.put<PageSiteSettings>("/admin/page-site", settings)).data;
}
export async function getPageNavigation(): Promise<PageNavigationItem[]> {
	return (await api.get<PageNavigationItem[]>("/page-site/navigation")).data;
}
export async function getPageHome(): Promise<PublishedPage | null> {
	const response = await api.get<PublishedPage | null>("/page-site/home");
	return response.status === 204 || !response.data ? null : response.data;
}
export async function listPageTemplates(): Promise<ReusablePageBlock[]> {
	return (await api.get<ReusablePageBlock[]>("/admin/page-templates")).data;
}
export async function createPageTemplate(name: string, block: PageBlock): Promise<ReusablePageBlock> {
	return (await api.post<ReusablePageBlock>("/admin/page-templates", { name, block })).data;
}
export async function deletePageTemplate(id: string): Promise<void> {
	await api.delete(`/admin/page-templates/${encodeURIComponent(id)}`);
}
