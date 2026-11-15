import { describe, expect, it, vi } from "vitest";
import { runUserBatch } from "./userBatch";

describe("runUserBatch", () => {
	it("continues after failures and reports the affected users", async () => {
		const users = [
			{ id: "one", current: false },
			{ id: "two", current: false },
			{ id: "three", current: false },
		];
		const error = new Error("failed");
		const action = vi.fn(async (user: { id: string }) => {
			if (user.id === "two") throw error;
		});

		const result = await runUserBatch(users, action);
		expect(action.mock.calls.map(([user]) => user.id)).toEqual(["one", "two", "three"]);
		expect(result.succeeded).toEqual([users[0], users[2]]);
		expect(result.failed).toEqual([{ user: users[1], error }]);
	});

	it("never applies an action to the current account", async () => {
		const user = { id: "self", current: true };
		const action = vi.fn();

		const result = await runUserBatch([user], action);
		expect(action).not.toHaveBeenCalled();
		expect(result.failed[0].user).toEqual(user);
	});
});
