import { describe, expect, it } from "vitest";
import { authViewportScale } from "./useAuthViewportFit";

describe("auth viewport scaling", () => {
	it("only scales down and fits both dimensions", () => {
		expect(authViewportScale(400, 700, 400, 800)).toBe(1);
		expect(authViewportScale(400, 1000, 400, 800)).toBe(0.8);
		expect(authViewportScale(800, 600, 400, 800)).toBe(0.5);
	});

	it("does not scale when measurements are unavailable", () => {
		expect(authViewportScale(0, 100, 400, 800)).toBe(1);
		expect(authViewportScale(100, 100, Number.NaN, 800)).toBe(1);
	});
});
