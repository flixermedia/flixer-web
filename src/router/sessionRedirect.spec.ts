import { describe, expect, it } from "vitest";
import { sanitizeRedirectTarget } from "./sessionRedirect";

describe("sanitizeRedirectTarget", () => {
	it("keeps safe in-app routes", () => {
		expect(sanitizeRedirectTarget("/")).toBe("/");
		expect(sanitizeRedirectTarget("/admin?tab=invites")).toBe("/admin?tab=invites");
		expect(sanitizeRedirectTarget("/movie/123#cast")).toBe("/movie/123#cast");
	});

	it("rejects auth routes to prevent redirect loops", () => {
		expect(sanitizeRedirectTarget("/login")).toBeUndefined();
		expect(sanitizeRedirectTarget("/login?redirect=/admin")).toBeUndefined();
		expect(sanitizeRedirectTarget("/register")).toBeUndefined();
		expect(sanitizeRedirectTarget("/register?invite=abc")).toBeUndefined();
		expect(sanitizeRedirectTarget("/oauth/sign-in?client_id=1")).toBeUndefined();
	});

	it("rejects external or non-string targets", () => {
		expect(sanitizeRedirectTarget(undefined)).toBeUndefined();
		expect(sanitizeRedirectTarget("https://example.com")).toBeUndefined();
		expect(sanitizeRedirectTarget("//example.com")).toBeUndefined();
		expect(sanitizeRedirectTarget("login")).toBeUndefined();
	});
});
