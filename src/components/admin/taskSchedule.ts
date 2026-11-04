export type ScheduleFrequency = "hourly" | "daily" | "weekly" | "monthly" | "custom";

export interface TaskScheduleDraft {
	frequency: ScheduleFrequency;
	time: string;
	intervalHours: number;
	dayOfWeek: number;
	dayOfMonth: number;
	customCron: string;
}

const DEFAULT_TIME = "03:00";

function cronTime(minuteValue: string, hourValue: string): string | null {
	const minute = Number(minuteValue);
	const hour = Number(hourValue);
	if (!Number.isInteger(minute) || minute < 0 || minute > 59 || !Number.isInteger(hour) || hour < 0 || hour > 23) {
		return null;
	}
	return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function parseTaskSchedule(cron: string): TaskScheduleDraft {
	const hourlyInterval = cron.match(/^0 \*\/([1-9]\d*) \* \* \*$/);
	if (hourlyInterval && Number(hourlyInterval[1]) < 24) {
		return {
			frequency: "hourly",
			time: DEFAULT_TIME,
			intervalHours: Number(hourlyInterval[1]),
			dayOfWeek: 0,
			dayOfMonth: 1,
			customCron: cron,
		};
	}
	if (cron === "0 * * * *") {
		return {
			frequency: "hourly",
			time: DEFAULT_TIME,
			intervalHours: 1,
			dayOfWeek: 0,
			dayOfMonth: 1,
			customCron: cron,
		};
	}

	const daily = cron.match(/^(\d{1,2}) (\d{1,2}) \* \* \*$/);
	const dailyTime = daily ? cronTime(daily[1], daily[2]) : null;
	if (daily && dailyTime) {
		return {
			frequency: "daily",
			time: dailyTime,
			intervalHours: 1,
			dayOfWeek: 0,
			dayOfMonth: 1,
			customCron: cron,
		};
	}

	const weekly = cron.match(/^(\d{1,2}) (\d{1,2}) \* \* ([0-6])$/);
	const weeklyTime = weekly ? cronTime(weekly[1], weekly[2]) : null;
	if (weekly && weeklyTime) {
		return {
			frequency: "weekly",
			time: weeklyTime,
			intervalHours: 1,
			dayOfWeek: Number(weekly[3]),
			dayOfMonth: 1,
			customCron: cron,
		};
	}

	const monthly = cron.match(/^(\d{1,2}) (\d{1,2}) (\d{1,2}) \* \*$/);
	const monthlyTime = monthly ? cronTime(monthly[1], monthly[2]) : null;
	if (monthly && monthlyTime && Number(monthly[3]) >= 1 && Number(monthly[3]) <= 31) {
		return {
			frequency: "monthly",
			time: monthlyTime,
			intervalHours: 1,
			dayOfWeek: 0,
			dayOfMonth: Number(monthly[3]),
			customCron: cron,
		};
	}

	return {
		frequency: "custom",
		time: DEFAULT_TIME,
		intervalHours: 1,
		dayOfWeek: 0,
		dayOfMonth: 1,
		customCron: cron,
	};
}

export function taskScheduleCron(draft: TaskScheduleDraft): string {
	if (draft.frequency === "custom") return draft.customCron.trim();
	if (draft.frequency === "hourly") {
		return draft.intervalHours === 1 ? "0 * * * *" : `0 */${draft.intervalHours} * * *`;
	}

	const [hour, minute] = draft.time.split(":");
	const daily = `${Number(minute)} ${Number(hour)}`;
	if (draft.frequency === "weekly") return `${daily} * * ${draft.dayOfWeek}`;
	if (draft.frequency === "monthly") return `${daily} ${draft.dayOfMonth} * *`;
	return `${daily} * * *`;
}
