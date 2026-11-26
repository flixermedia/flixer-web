const AUTH_PATH_PATTERN = /^\/(?:login|register|oauth\/sign-in)(?:[?#]|$)/;

/**
 * Returns `target` when it is a safe in-app destination that is not an auth screen,
 * preventing redirect loops such as `/login?redirect=/login`.
 */
export function sanitizeRedirectTarget(target: unknown): string | undefined {
	if (typeof target !== "string" || !target.startsWith("/") || target.startsWith("//")) {
		return undefined;
	}
	if (AUTH_PATH_PATTERN.test(target)) {
		return undefined;
	}
	return target;
}
