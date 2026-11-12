import { compare, rcompare, valid } from "semver";

export type PluginVersionAction = "install" | "uninstall" | "upgrade" | "downgrade" | "switch";

export function isValidPluginVersion(version: string): boolean {
	return valid(version) !== null;
}

export function sortPluginVersions<T extends { version: string }>(versions: readonly T[]): T[] {
	return [...versions].sort((left, right) => {
		const leftValid = isValidPluginVersion(left.version);
		const rightValid = isValidPluginVersion(right.version);
		if (leftValid && rightValid) return rcompare(left.version, right.version);
		if (leftValid !== rightValid) return leftValid ? -1 : 1;
		return right.version.localeCompare(left.version);
	});
}

export function pluginVersionAction(selectedVersion: string, installedVersion?: string): PluginVersionAction {
	if (!installedVersion) return "install";
	if (selectedVersion === installedVersion) return "uninstall";
	if (!isValidPluginVersion(selectedVersion) || !isValidPluginVersion(installedVersion)) return "switch";
	const order = compare(selectedVersion, installedVersion);
	return order > 0 ? "upgrade" : order < 0 ? "downgrade" : "switch";
}
