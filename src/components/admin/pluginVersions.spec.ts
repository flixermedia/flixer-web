import { describe, expect, it } from "vitest";
import { isValidPluginVersion, pluginVersionAction, sortPluginVersions } from "./pluginVersions";

describe("plugin catalog versions", () => {
	it("orders releases by semantic version, including prereleases", () => {
		const versions = [{ version: "1.9.0" }, { version: "1.10.0-beta.1" }, { version: "1.10.0" }, { version: "0.1.1" }];
		expect(sortPluginVersions(versions).map((release) => release.version)).toEqual(["1.10.0", "1.10.0-beta.1", "1.9.0", "0.1.1"]);
		expect(versions[0]?.version).toBe("1.9.0");
	});

	it("selects the appropriate action for the chosen version", () => {
		expect(pluginVersionAction("1.0.0")).toBe("install");
		expect(pluginVersionAction("1.0.0", "1.0.0")).toBe("uninstall");
		expect(pluginVersionAction("1.10.0", "1.9.0")).toBe("upgrade");
		expect(pluginVersionAction("1.10.0-beta.1", "1.10.0")).toBe("downgrade");
		expect(pluginVersionAction("1.0.0+build.2", "1.0.0+build.1")).toBe("switch");
	});

	it("keeps malformed releases after valid versions without crashing", () => {
		const versions = [{ version: "1.0.0-01" }, { version: "1.0.0" }];
		expect(sortPluginVersions(versions).map((release) => release.version)).toEqual(["1.0.0", "1.0.0-01"]);
		expect(isValidPluginVersion("1.0.0-01")).toBe(false);
	});
});
