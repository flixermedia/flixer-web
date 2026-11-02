/** Flattens the router query to string:string, taking the first value of repeated params. */
export function queryFromRoute(query) {
    const result = {};
    for (const [key, value] of Object.entries(query)) {
        const first = Array.isArray(value) ? value[0] : value;
        if (typeof first === 'string')
            result[key] = first;
    }
    return result;
}
/** Overlays `patch` on `current`; empty values and `reset` keys are removed. */
export function applyQuery(current, patch, reset = []) {
    const result = { ...current };
    for (const key of reset)
        delete result[key];
    for (const [key, value] of Object.entries(patch)) {
        if (value === '')
            delete result[key];
        else
            result[key] = value;
    }
    return result;
}
export function resolveNav(current, nav) {
    return applyQuery(nav.merge ? current : {}, nav.query);
}
export function activeTab(tabs, query, param) {
    const requested = query[param];
    return tabs.find((tab) => tab.id === requested)?.id ?? tabs[0]?.id;
}
export function pagerState(page, pageSize, total) {
    const pages = Math.max(1, Math.ceil(total / pageSize));
    const current = Math.min(page, pages);
    const first = total === 0 ? 0 : (current - 1) * pageSize + 1;
    return { pages, current, first, last: Math.min(total, current * pageSize), hasPrev: current > 1, hasNext: current < pages };
}
export function isBooleanField(field) {
    return field.type === 'checkbox' || field.type === 'switch';
}
/** Builds the field values a form submits: numbers are coerced, checkboxes are booleans. */
export function coerceFormValues(fields, raw) {
    const values = {};
    for (const field of fields) {
        const value = raw[field.name];
        if (isBooleanField(field)) {
            values[field.name] = value === true;
        }
        else if (field.type === 'number') {
            const parsed = typeof value === 'number' ? value : typeof value === 'string' && value.trim() !== '' ? Number(value) : NaN;
            values[field.name] = Number.isFinite(parsed) ? parsed : null;
        }
        else {
            values[field.name] = typeof value === 'string' ? value : value == null ? '' : String(value);
        }
    }
    return values;
}
export function initialFormValues(fields) {
    const values = {};
    for (const field of fields) {
        if (isBooleanField(field))
            values[field.name] = field.value === true;
        else if (field.type === 'password')
            values[field.name] = '';
        else
            values[field.name] = field.value ?? (field.type === 'select' && !field.placeholder ? (field.options?.[0]?.value ?? '') : '');
    }
    return values;
}
export function buildActionBody(action, values = {}) {
    return { ...action.body, ...values };
}
/** Decides what happens after a successful action call: response navigate wins over action navigate, which wins over reload. */
export function planActionOutcome(action, response) {
    if (response.error)
        return { error: response.error, reload: false };
    const navigate = response.navigate ?? action.navigate;
    return { toast: response.toast, navigate, reload: !navigate && (response.reload === true || action.reload === true) };
}
export function toastKind(tone) {
    return tone === 'success' ? 'success' : tone === 'danger' ? 'error' : 'info';
}
