import type { PluginCatalogEntry, PluginInstallation, PluginRepository, PluginSettingsView, PluginUpdateHistoryEntry } from "../api";

export const pluginInstallationsFixture: PluginInstallation[] = [
	{
		id: "flixer-lyrics",
		version: "1.2.0",
		status: "enabled",
		enabled: true,
		approvedPermissions: ["network", "library.read"],
		activationSupported: true,
		activationReason: null,
		targetStatus: { flixer: "running" },
		lastError: null,
		manifest: {
			manifestVersion: 1,
			id: "flixer-lyrics",
			name: "Lyrics Fetcher",
			version: "1.2.0",
			description: "Downloads synced lyrics for your music library.",
			author: "Flixer",
			license: "MIT",
			compatibility: { pluginApi: "^1.0.0" },
			targets: {},
			capabilities: ["lyrics"],
			permissions: ["network", "library.read"],
		},
		repository: { id: "repo-1", name: "Official plugins", isOfficial: true },
		availableUpdate: { version: "1.3.0", permissions: ["network", "library.read", "library.write"] },
		installedAt: "2026-09-01T10:00:00.000Z",
		updatedAt: "2026-10-12T08:30:00.000Z",
	},
	{
		id: "flixer-notify",
		version: "0.4.1",
		status: "disabled",
		enabled: false,
		approvedPermissions: ["network"],
		activationSupported: true,
		activationReason: null,
		targetStatus: {},
		lastError: null,
		manifest: {
			manifestVersion: 1,
			id: "flixer-notify",
			name: "Webhook Notifier",
			version: "0.4.1",
			description: "Sends a webhook when new media is added.",
			author: "Community",
			license: "Apache-2.0",
			compatibility: { pluginApi: "^1.0.0" },
			targets: {},
			capabilities: ["notifications"],
			permissions: ["network"],
		},
		repository: null,
		availableUpdate: null,
		installedAt: "2026-08-20T14:00:00.000Z",
		updatedAt: "2026-08-20T14:00:00.000Z",
	},
];

export const pluginRepositoriesFixture: PluginRepository[] = [
	{ id: "repo-1", name: "Official plugins", url: "https://plugins.flixer.example/index.json", isOfficial: true, enabled: true, lastCheckedAt: "2026-11-05T08:00:00.000Z", lastError: null, manifest: null, createdAt: "2026-08-01T00:00:00.000Z", updatedAt: "2026-11-05T08:00:00.000Z" },
	{ id: "repo-2", name: "Community", url: "https://example.org/flixer-plugins.json", isOfficial: false, enabled: true, lastCheckedAt: null, lastError: "Request failed with status 404", manifest: null, createdAt: "2026-09-10T00:00:00.000Z", updatedAt: "2026-09-10T00:00:00.000Z" },
];

export const pluginCatalogFixture: PluginCatalogEntry[] = [
	{
		repository: { id: "repo-1", name: "Official plugins", url: "https://plugins.flixer.example/index.json", isOfficial: true },
		id: "flixer-subtitles-extra",
		name: "Extra Subtitles",
		description: "Adds more subtitle providers.",
		author: "Flixer",
		capabilities: ["subtitles"],
		permissions: ["network"],
		targets: ["flixer", "flixer-web"],
		versions: [{ version: "2.0.0", manifest: "manifest.json", package: "extra-subtitles-2.0.0.zip", sha256: "0".repeat(64), size: 48213 }],
	},
];

export const pluginHistoryFixture: PluginUpdateHistoryEntry[] = [
	{ id: "h1", pluginId: "flixer-lyrics", action: "update", fromVersion: "1.1.0", toVersion: "1.2.0", outcome: "succeeded", errorMessage: null, createdAt: "2026-10-12T08:30:00.000Z" },
	{ id: "h2", pluginId: "flixer-lyrics", action: "install", fromVersion: null, toVersion: "1.1.0", outcome: "succeeded", errorMessage: null, createdAt: "2026-09-01T10:00:00.000Z" },
];

export const pluginSettingsFixture: PluginSettingsView = {
	schema: {
		type: "object",
		properties: {
			language: { type: "string", title: "Preferred language", description: "Used when several lyrics are available.", enum: ["en", "de", "fr"], default: "en" },
			maxPerRun: { type: "integer", title: "Max tracks per run", default: 100 },
			syncedOnly: { type: "boolean", title: "Synced lyrics only", default: true },
			providers: { type: "array", title: "Providers", description: "Comma separated.", items: { type: "string" }, default: ["lrclib", "musixmatch"] },
			apiKey: { type: "string", title: "API key", writeOnly: true },
		},
	},
	values: { language: "en" },
	secretFields: [],
} as PluginSettingsView;
