export interface BatchUser {
	id: string;
	current: boolean;
}

export interface BatchResult<T extends BatchUser> {
	succeeded: T[];
	failed: Array<{ user: T; error: unknown }>;
}

export async function runUserBatch<T extends BatchUser>(users: T[], action: (user: T) => Promise<unknown>): Promise<BatchResult<T>> {
	const result: BatchResult<T> = { succeeded: [], failed: [] };
	for (const user of users) {
		if (user.current) {
			result.failed.push({ user, error: new Error("Cannot apply a bulk action to the current account.") });
			continue;
		}
		try {
			await action(user);
			result.succeeded.push(user);
		} catch (error) {
			result.failed.push({ user, error });
		}
	}
	return result;
}
