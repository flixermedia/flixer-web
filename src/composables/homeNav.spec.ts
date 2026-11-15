import { describe, expect, it, vi } from "vitest";

vi.mock("../i18n", () => ({ i18n: { global: { t: (key: string) => key } } }));
vi.mock("./useRequestsConfig", () => ({ useRequestsConfig: () => ({ enabled: { value: false }, load: vi.fn() }) }));
vi.mock("./usePluginPages", () => ({ pagePath: vi.fn(), usePluginPages: () => ({ mainPages: { value: [] }, load: vi.fn() }) }));

import { getMobileTabs, getNavLinks, isActivePath } from "./homeNav";

describe("collection navigation", () => {
	it("includes collections in desktop and mobile navigation", () => {
		expect(getNavLinks()).toContainEqual({ label: "collectionsPage.title", to: "/collections" });
		expect(getMobileTabs()).toContainEqual({ label: "collectionsPage.title", to: "/collections", icon: "lucide:library" });
		expect(isActivePath("/collections/automatic/example", "/collections")).toBe(true);
	});
});
