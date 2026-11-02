import { createI18n } from 'vue-i18n';
import { describe, expect, it } from 'vitest';
import en from '../locales/en.json';
function createUntyped() {
    const create = createI18n;
    return create({ legacy: false, locale: 'en', messages: { en }, missingWarn: false, warnHtmlMessage: false });
}
function leaves(value, path = '') {
    if (typeof value === 'string')
        return [path];
    if (typeof value !== 'object' || value === null)
        return [];
    return Object.entries(value).flatMap(([key, child]) => leaves(child, path ? `${path}.${key}` : key));
}
// vue-i18n only compiles a message when it is first shown, so a bad one (a bare "@" or "|") breaks that screen at runtime.
describe('setup messages', () => {
    it('all compile and render', () => {
        const errors = [];
        const i18n = createUntyped();
        const keys = leaves(en.setup, 'setup');
        expect(keys.length).toBeGreaterThan(50);
        for (const key of keys) {
            try {
                const text = i18n.global.t(key, { services: 'x', message: 'x' });
                if (text === key)
                    errors.push(`${key}: did not render`);
            }
            catch (error) {
                errors.push(`${key}: ${error.message}`);
            }
        }
        expect(errors).toEqual([]);
    });
});
