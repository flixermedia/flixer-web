import { describe, expect, it } from "vitest";
import { defaultPagePosition, type PageBlock } from "./pageBuilder";

describe("builder default positions", () => {
	it("keeps new elements below the built-in authentication form", () => {
		const blocks: PageBlock[] = [
			{ id: "auth", type: "auth", text: "", image: null },
			{ id: "heading", type: "heading", text: "", image: null },
		];
		expect(defaultPagePosition(blocks, 1, "desktop")).toEqual({ x: 0, y: 950, width: 50 });
		expect(defaultPagePosition(blocks, 2, "mobile")).toEqual({ x: 0, y: 1130, width: 90 });
	});
});
