import { createI18n } from "vue-i18n";
import { describe, expect, it } from "vitest";
import de from "../locales/de.json";
import en from "../locales/en.json";
import es from "../locales/es.json";
import et from "../locales/et.json";

function leaves(value: unknown, path = ""): string[] {
	if (typeof value === "string") return [path];
	if (typeof value !== "object" || value === null) return [];
	return Object.entries(value).flatMap(([key, child]) => leaves(child, path ? `${path}.${key}` : key));
}

describe("bulk user translations", () => {
	it.each(Object.entries({ en, de, es, et }))("defines and renders every bulk label in %s", (locale, messages) => {
		const expectedKeys = [...leaves(en.admin.users.bulk, "admin.users.bulk"), ...leaves(en.admin.loginSecurity, "admin.loginSecurity"), ...leaves(en.remotePlayback, "remotePlayback"), ...leaves(en.playbackHistory, "playbackHistory"), ...leaves(en.playbackTabs, "playbackTabs"), ...leaves(en.userMedia, "userMedia"), ...leaves(en.userMediaOrder, "userMediaOrder"), ...leaves(en.recommendationFeedback, "recommendationFeedback"), ...leaves(en.recommendationReview, "recommendationReview"), ...leaves(en.browseFilters, "browseFilters"), ...leaves(en.collectionsPage, "collectionsPage")];
		const actualKeys = leaves(messages, "");
		expect(actualKeys).toEqual(expect.arrayContaining(expectedKeys));

		const create = createI18n as unknown as (options: object) => { global: { t(key: string, values: Record<string, string>): string } };
		const i18n = create({ legacy: false, locale, messages: { [locale]: messages }, missingWarn: false });
		for (const key of expectedKeys) {
			expect(i18n.global.t(key, { name: "alex", users: "alex", count: "2", action: "action", succeeded: "1", failed: "1" })).not.toBe(key);
		}
	});
});
