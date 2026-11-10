import { describe, expect, it, vi } from "vitest";
import { notify } from "./notify";

const mockToast = vi.hoisted(() => ({ error: vi.fn(), success: vi.fn(), info: vi.fn() }));
vi.mock("vue3-toastify", () => ({ toast: mockToast }));

describe("notifications", () => {
	it("allows sign-in warnings to survive a route change without changing other errors", () => {
		notify.error("Sign-in warning", undefined, { clearOnUrlChange: false });
		expect(mockToast.error).toHaveBeenLastCalledWith("Sign-in warning", expect.objectContaining({ clearOnUrlChange: false, autoClose: 8000 }));
		notify.error("Other error");
		expect(mockToast.error).toHaveBeenLastCalledWith("Other error", expect.not.objectContaining({ clearOnUrlChange: false }));
	});
});
