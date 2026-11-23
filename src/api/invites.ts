/** Invitation management and public invite redemption. */

import { api } from "./client";
import type { AuthResult, VerificationPending } from "flixer-api-client";
import type { PaymentPending } from "./auth";

export type InviteServerType = "flixer" | "jellyfin" | "emby" | "plex" | "other";
export type InviteDestinationType = InviteServerType;

export interface InviteServer {
	id: string;
	name: string;
	type: InviteServerType;
	url: string;
	externalUrl: string | null;
	hasApiKey: boolean;
	instructions: string | null;
	enabled: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface InviteServerInput {
	name?: string;
	type?: InviteServerType;
	url?: string;
	externalUrl?: string | null;
	apiKey?: string;
	instructions?: string;
	enabled?: boolean;
}

export interface Invitation {
	id: string;
	code: string;
	label: string | null;
	server: { id: string; name: string; type: InviteServerType } | null;
	maxUses: number | null;
	usedCount: number;
	expiresAt: string | null;
	disabled: boolean;
	libraryMode: "all" | "selected";
	libraryIds: string[];
	externalLibraryIds: string[];
	allowDownloads: boolean;
	skipPayment: boolean;
	skipEmailVerification: boolean;
	disablePlexOnlineSources: boolean;
	userExpiresInDays: number | null;
	createdAt: string;
	updatedAt: string;
}

export interface InvitationInput {
	code?: string;
	label?: string | null;
	serverId?: string | null;
	maxUses?: number | null;
	expiresAt?: string | null;
	disabled?: boolean;
	libraryMode?: "all" | "selected";
	libraryIds?: string[];
	externalLibraryIds?: string[];
	allowDownloads?: boolean;
	skipPayment?: boolean;
	skipEmailVerification?: boolean;
	disablePlexOnlineSources?: boolean;
	userExpiresInDays?: number | null;
}

export interface InvitationUsage {
	id: string;
	invitationId: string;
	userId: string | null;
	username: string;
	status: "pending_payment" | "pending_verification" | "completed" | "failed";
	externalUserId: string | null;
	externalEmail: string | null;
	error: string | null;
	expiresAt: string | null;
	createdAt: string;
}

export interface PublicInvite {
	code: string;
	label: string | null;
	destination: { type: InviteDestinationType; name: string | null };
	paymentRequired: boolean;
	expiresAt: string | null;
	usesRemaining: number | null;
}

export interface InviteDestination {
	type: InviteDestinationType;
	name: string | null;
	url: string | null;
	instructions: string | null;
	invitedByEmail: boolean;
}

export interface InviteAccountExists {
	accountExists: true;
}

export type InviteVerificationPending = VerificationPending & { resendToken?: string };

export type InviteRedemptionResult = (AuthResult | InviteVerificationPending | PaymentPending | InviteAccountExists) & { destination: InviteDestination };

export interface PlexInviteAuthStart {
	sessionToken: string;
	authUrl: string;
}

export interface PlexInviteAccount {
	username: string;
	displayName: string;
	email: string;
	avatarUrl: string | null;
}

export type PlexInviteAuthPoll = { status: "pending" | "expired" } | { status: "authenticated"; plexAuthTicket: string; account: PlexInviteAccount };

// ---- Admin -------------------------------------------------------------------------------------------------------

export async function listInviteServers(): Promise<InviteServer[]> {
	return (await api.get<InviteServer[]>("/admin/invites/servers")).data;
}

export async function createInviteServer(input: InviteServerInput): Promise<InviteServer> {
	return (await api.post<InviteServer>("/admin/invites/servers", input)).data;
}

export async function updateInviteServer(id: string, input: InviteServerInput): Promise<InviteServer> {
	return (await api.patch<InviteServer>(`/admin/invites/servers/${encodeURIComponent(id)}`, input)).data;
}

export async function deleteInviteServer(id: string): Promise<void> {
	await api.delete(`/admin/invites/servers/${encodeURIComponent(id)}`);
}

export async function testInviteServer(id: string): Promise<void> {
	await api.post(`/admin/invites/servers/${encodeURIComponent(id)}/test`);
}

export async function listInvitations(): Promise<Invitation[]> {
	return (await api.get<Invitation[]>("/admin/invites")).data;
}

export async function createInvitation(input: InvitationInput): Promise<Invitation> {
	return (await api.post<Invitation>("/admin/invites", input)).data;
}

export async function updateInvitation(id: string, input: InvitationInput): Promise<Invitation> {
	return (await api.patch<Invitation>(`/admin/invites/${encodeURIComponent(id)}`, input)).data;
}

export async function deleteInvitation(id: string): Promise<void> {
	await api.delete(`/admin/invites/${encodeURIComponent(id)}`);
}

export async function listInvitationUsages(id: string): Promise<InvitationUsage[]> {
	return (await api.get<InvitationUsage[]>(`/admin/invites/${encodeURIComponent(id)}/usages`)).data;
}

// ---- Public ------------------------------------------------------------------------------------------------------

export async function getInvite(code: string): Promise<PublicInvite> {
	return (await api.get<PublicInvite>(`/invites/${encodeURIComponent(code)}`)).data;
}

export async function acceptInvite(code: string, details: { username: string; password: string; email: string; displayName?: string }): Promise<InviteRedemptionResult> {
	return (await api.post<InviteRedemptionResult>(`/invites/${encodeURIComponent(code)}/accept`, details)).data;
}

export async function loginInvite(code: string, credentials: { username: string; password: string }): Promise<InviteRedemptionResult> {
	return (await api.post<InviteRedemptionResult>(`/invites/${encodeURIComponent(code)}/login`, credentials)).data;
}

export async function resendInviteVerification(code: string, resendToken: string): Promise<{ sent: true }> {
	return (await api.post<{ sent: true }>(`/invites/${encodeURIComponent(code)}/resend-verification`, { resendToken })).data;
}

export async function startPlexInviteAuth(code: string): Promise<PlexInviteAuthStart> {
	return (await api.post<PlexInviteAuthStart>(`/invites/${encodeURIComponent(code)}/plex/start`)).data;
}

export async function pollPlexInviteAuth(code: string, sessionToken: string): Promise<PlexInviteAuthPoll> {
	return (await api.post<PlexInviteAuthPoll>(`/invites/${encodeURIComponent(code)}/plex/poll`, { sessionToken })).data;
}

export async function acceptPlexInvite(code: string, plexAuthTicket: string): Promise<InviteRedemptionResult> {
	return (await api.post<InviteRedemptionResult>(`/invites/${encodeURIComponent(code)}/plex/accept`, { plexAuthTicket })).data;
}
