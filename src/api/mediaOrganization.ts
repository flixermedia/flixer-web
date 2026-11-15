import { api } from "./client";

export interface MediaOrganizationTemplates {
	movie: string;
	series: string;
	episode: string;
	music: string;
}

export interface MediaOrganizationMove {
	itemId: string;
	rootId: string;
	libraryFolder: string;
	type: "movie" | "episode" | "track";
	title: string;
	sourceRelativePath: string;
	targetRelativePath: string;
}

export interface MediaOrganizationAuditEvent {
	id: string;
	planId: string;
	actorId: string | null;
	action: string;
	details: Record<string, unknown>;
	createdAt: string;
}

export interface MediaOrganizationPlan {
	id: string;
	libraryId: string;
	state: "preview" | "executing" | "completed" | "failed" | "rolling_back" | "rolled_back" | "rollback_failed" | "discarded";
	templates: MediaOrganizationTemplates;
	moves: MediaOrganizationMove[];
	summary: { moveCount: number; unchangedCount: number; totalBytes: number };
	createdBy: string | null;
	error: string | null;
	executedAt: string | null;
	rolledBackAt: string | null;
	createdAt: string;
	updatedAt: string;
	audit?: MediaOrganizationAuditEvent[];
}

export type OrganizationMoveStatus = "notMoved" | "moved" | "bothExist" | "neitherExists" | "changed" | "unavailable";
export interface OrganizationMoveReconciliation {
	itemId: string;
	title: string;
	sourceRelativePath: string;
	targetRelativePath: string;
	status: OrganizationMoveStatus;
}
export interface OrganizationPlanReconciliation {
	planId: string;
	state: string;
	total: number;
	offset: number;
	limit: number;
	nextOffset: number | null;
	scanned: number;
	counts: Record<OrganizationMoveStatus, number>;
	items: OrganizationMoveReconciliation[];
}

export interface MediaOrganizationSettings {
	organizationWritesEnabled: boolean;
	nfoWritesEnabled: boolean;
	templates: MediaOrganizationTemplates;
	plans: MediaOrganizationPlan[];
}

const basePath = (libraryId: string) => `/admin/media-libraries/${encodeURIComponent(libraryId)}/organization`;

export async function getMediaOrganization(libraryId: string): Promise<MediaOrganizationSettings> {
	const response = await api.get<MediaOrganizationSettings>(basePath(libraryId));
	return response.data;
}

export async function saveMediaOrganizationTemplates(libraryId: string, templates: MediaOrganizationTemplates): Promise<MediaOrganizationTemplates> {
	const response = await api.put<MediaOrganizationTemplates>(`${basePath(libraryId)}/templates`, { templates });
	return response.data;
}

export async function saveMediaWritePermissions(libraryId: string, permissions: Pick<MediaOrganizationSettings, "organizationWritesEnabled" | "nfoWritesEnabled">): Promise<Pick<MediaOrganizationSettings, "organizationWritesEnabled" | "nfoWritesEnabled">> {
	const response = await api.put<Pick<MediaOrganizationSettings, "organizationWritesEnabled" | "nfoWritesEnabled">>(`${basePath(libraryId)}/write-permissions`, permissions);
	return response.data;
}

export async function createMediaOrganizationPlan(libraryId: string): Promise<MediaOrganizationPlan> {
	const response = await api.post<MediaOrganizationPlan>(`${basePath(libraryId)}/plans`);
	return response.data;
}

export async function getMediaOrganizationPlan(libraryId: string, planId: string): Promise<MediaOrganizationPlan> {
	const response = await api.get<MediaOrganizationPlan>(`${basePath(libraryId)}/plans/${encodeURIComponent(planId)}`);
	return response.data;
}

export async function reconcileMediaOrganizationPlan(libraryId: string, planId: string, offset = 0, limit = 100): Promise<OrganizationPlanReconciliation> {
	const response = await api.get<OrganizationPlanReconciliation>(`${basePath(libraryId)}/plans/${encodeURIComponent(planId)}/reconcile`, { params: { offset, limit } });
	return response.data;
}

export async function recoverUnmovedMediaOrganizationPlan(libraryId: string, planId: string, password: string): Promise<MediaOrganizationPlan> {
	const response = await api.post<MediaOrganizationPlan>(`${basePath(libraryId)}/plans/${encodeURIComponent(planId)}/recover`, { password });
	return response.data;
}

export async function executeMediaOrganizationPlan(libraryId: string, planId: string, password: string): Promise<MediaOrganizationPlan> {
	const response = await api.post<MediaOrganizationPlan>(`${basePath(libraryId)}/plans/${encodeURIComponent(planId)}/execute`, { password });
	return response.data;
}

export async function rollbackMediaOrganizationPlan(libraryId: string, planId: string, password: string): Promise<MediaOrganizationPlan> {
	const response = await api.post<MediaOrganizationPlan>(`${basePath(libraryId)}/plans/${encodeURIComponent(planId)}/rollback`, { password });
	return response.data;
}

export async function discardMediaOrganizationPlan(libraryId: string, planId: string): Promise<void> {
	await api.delete(`${basePath(libraryId)}/plans/${encodeURIComponent(planId)}`);
}
