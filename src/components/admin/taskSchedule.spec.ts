import { describe, expect, it } from "vitest";
import { parseTaskSchedule, taskScheduleCron } from "./taskSchedule";

describe("task schedule controls", () => {
	it.each([
		["0 */12 * * *", "hourly", 12],
		["0 */6 * * *", "hourly", 6],
		["0 * * * *", "hourly", 1],
	] as const)("reads hourly schedule %s", (cron, frequency, intervalHours) => {
		expect(parseTaskSchedule(cron)).toMatchObject({ frequency, intervalHours });
	});

	it("converts daily, weekly, and monthly schedules to controls", () => {
		expect(parseTaskSchedule("0 3 * * *")).toMatchObject({ frequency: "daily", time: "03:00" });
		expect(parseTaskSchedule("0 3 * * 0")).toMatchObject({ frequency: "weekly", time: "03:00", dayOfWeek: 0 });
		expect(parseTaskSchedule("30 22 15 * *")).toMatchObject({ frequency: "monthly", time: "22:30", dayOfMonth: 15 });
	});

	it("preserves schedules that do not match a supported preset as custom cron", () => {
		expect(parseTaskSchedule("*/15 * * * *")).toMatchObject({
			frequency: "custom",
			customCron: "*/15 * * * *",
		});
		expect(parseTaskSchedule("")).toMatchObject({ frequency: "custom", customCron: "" });
		expect(parseTaskSchedule("0 27 * * *")).toMatchObject({ frequency: "custom", customCron: "0 27 * * *" });
	});

	it("creates cron expressions from selected schedule controls", () => {
		expect(taskScheduleCron({ ...parseTaskSchedule(""), frequency: "hourly", intervalHours: 6 })).toBe("0 */6 * * *");
		expect(taskScheduleCron({ ...parseTaskSchedule(""), frequency: "daily", time: "03:15" })).toBe("15 3 * * *");
		expect(taskScheduleCron({ ...parseTaskSchedule(""), frequency: "weekly", time: "22:30", dayOfWeek: 2 })).toBe("30 22 * * 2");
		expect(taskScheduleCron({ ...parseTaskSchedule(""), frequency: "monthly", time: "08:05", dayOfMonth: 20 })).toBe("5 8 20 * *");
	});
});
