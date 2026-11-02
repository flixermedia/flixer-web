import { openModal } from '@kolirt/vue-modal';
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { getAdminOverview, getPreferences, updatePreferences } from '../../api';
import { notify } from '../../composables/notify';
import { useLiveTopic } from '../../composables/useLive';
import { describeRequestError } from '../../composables/useProfile';
import { catchError } from '../../utils/catchError';
import ActivityWidget from './dashboard/ActivityWidget.vue';
import AddWidgetModal from './AddWidgetModal.vue';
import BackupsWidget from './dashboard/BackupsWidget.vue';
import ContentMixWidget from './dashboard/ContentMixWidget.vue';
import LibrariesWidget from './dashboard/LibrariesWidget.vue';
import QueuesWidget from './dashboard/QueuesWidget.vue';
import RequestsWidget from './dashboard/RequestsWidget.vue';
import ServicesWidget from './dashboard/ServicesWidget.vue';
import ShortcutsWidget from './dashboard/ShortcutsWidget.vue';
import TranscodingWidget from './dashboard/TranscodingWidget.vue';
import UpdatesWidget from './dashboard/UpdatesWidget.vue';
import UptimeWidget from './dashboard/UptimeWidget.vue';
import UsersWidget from './dashboard/UsersWidget.vue';
import { GRID_COLUMNS } from './dashboard/dashboardCatalog';
import { DEFAULT_GRID, addWidget, isDefaultGrid, normalizeGrid, placeWidget, removeWidget, rowCount, sameGrid } from './dashboard/dashboardLayout';
import ServerWidget from './dashboard/ServerWidget.vue';
import StatsWidget from './dashboard/StatsWidget.vue';
import StorageWidget from './dashboard/StorageWidget.vue';
import DashboardWidgetSkeleton from './DashboardWidgetSkeleton.vue';
import LogsPanel from './LogsPanel.vue';
import StreamSessionsPanel from './StreamSessionsPanel.vue';
const { t } = useI18n();
// Must match the grid CSS below: rows are half a row (96px) tall with a 16px gap between all cells.
const ROW_UNIT = 96;
const GAP = 16;
const EXTRA_ROWS = 6;
const overview = ref(null);
const isLoading = ref(true);
const isLayoutLoading = ref(true);
const loadError = ref('');
const saved = ref(normalizeGrid(undefined));
const draft = ref([]);
const editing = ref(false);
const isSaving = ref(false);
const announcement = ref('');
const justAdded = ref(null);
const gridEl = ref(null);
const gesture = ref(null);
let stopGesture;
// While a gesture is in progress the grid shows where the panel would land and which panels it pushes aside.
const layout = computed(() => {
    if (!editing.value)
        return saved.value;
    return gesture.value ? placeWidget(draft.value, gesture.value.id, gesture.value.patch) : draft.value;
});
const orderOf = computed(() => new Map([...layout.value].sort((a, b) => a.y - b.y || a.x - b.x).map((item, index) => [item.id, index])));
const rows = computed(() => rowCount(layout.value) + (editing.value ? EXTRA_ROWS : 0));
const changed = computed(() => !sameGrid(draft.value, saved.value));
const COMPONENTS = { stats: StatsWidget, server: ServerWidget, storage: StorageWidget, activity: ActivityWidget, uptime: UptimeWidget, transcoding: TranscodingWidget, libraries: LibrariesWidget, 'content-mix': ContentMixWidget, services: ServicesWidget };
const STANDALONE = { queues: QueuesWidget, updates: UpdatesWidget, backups: BackupsWidget, requests: RequestsWidget, users: UsersWidget, shortcuts: ShortcutsWidget };
const needsOverview = (id) => id in COMPONENTS;
const standalone = (id) => id in STANDALONE;
const iconButton = 'inline-flex h-8 w-8 items-center justify-center rounded bg-white/10 text-sm transition hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-flixer-accent disabled:opacity-30';
const resizeHandle = 'absolute z-20 hidden items-center justify-center touch-none lg:flex';
const label = (id) => t(`admin.dashboard.widgets.${id}`);
const isWide = () => window.matchMedia('(min-width: 1024px)').matches;
const find = (id) => draft.value.find((item) => item.id === id);
function announce(id) {
    const item = find(id);
    if (item)
        announcement.value = t('admin.dashboard.placed', { widget: label(id), column: item.x + 1, row: item.y + 1, width: item.w, height: item.h });
}
function startEditing() {
    justAdded.value = null;
    draft.value = saved.value.map((item) => ({ ...item }));
    editing.value = true;
}
function cancel() {
    stopGesture?.();
    editing.value = false;
}
function geometry() {
    const box = gridEl.value.getBoundingClientRect();
    return { left: box.left, top: box.top, pitchX: (box.width + GAP) / GRID_COLUMNS, pitchY: ROW_UNIT + GAP };
}
/** Follows the pointer until it is released, then applies the result. Escape abandons it. */
function track(id, patchFor) {
    stopGesture?.();
    const onMove = (event) => {
        gesture.value = { id, patch: patchFor(event) };
    };
    const finish = (apply) => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        window.removeEventListener('pointercancel', onCancel);
        window.removeEventListener('keydown', onKey);
        if (apply && gesture.value) {
            draft.value = placeWidget(draft.value, id, gesture.value.patch);
            announce(id);
        }
        gesture.value = null;
        stopGesture = undefined;
    };
    const onUp = () => finish(true);
    const onCancel = () => finish(false);
    const onKey = (event) => event.key === 'Escape' && finish(false);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onCancel);
    window.addEventListener('keydown', onKey);
    stopGesture = () => finish(false);
}
function startMove(id, event) {
    const item = find(id);
    const card = event.currentTarget.closest('[data-widget]');
    if (!item || !card || !gridEl.value || !isWide() || event.button !== 0)
        return;
    event.preventDefault();
    const box = card.getBoundingClientRect();
    const grabX = event.clientX - box.left;
    const grabY = event.clientY - box.top;
    track(id, (move) => {
        const { left, top, pitchX, pitchY } = geometry();
        return { x: Math.round((move.clientX - grabX - left) / pitchX), y: Math.round((move.clientY - grabY - top) / pitchY) };
    });
}
function startResize(id, edges, event) {
    const item = find(id);
    if (!item || !gridEl.value || event.button !== 0)
        return;
    event.preventDefault();
    track(id, (move) => {
        const { left, top, pitchX, pitchY } = geometry();
        const patch = {};
        if (edges.width)
            patch.w = Math.min(GRID_COLUMNS - item.x, Math.max(1, Math.round((move.clientX - left - item.x * pitchX + GAP) / pitchX)));
        if (edges.height)
            patch.h = Math.max(1, Math.round((move.clientY - top - item.y * pitchY + GAP) / pitchY));
        return patch;
    });
}
const ARROWS = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
// Arrow keys move a focused panel one cell at a time; with Shift they resize it instead.
function onHandleKey(id, event) {
    const step = ARROWS[event.key];
    const item = find(id);
    if (!step || !item)
        return;
    event.preventDefault();
    draft.value = event.shiftKey
        ? placeWidget(draft.value, id, { w: Math.min(GRID_COLUMNS - item.x, item.w + step[0]), h: item.h + step[1] })
        : placeWidget(draft.value, id, { x: item.x + step[0], y: item.y + step[1] });
    announce(id);
}
async function addPanel() {
    const [error, id] = await catchError(openModal(AddWidgetModal, { props: { added: draft.value.map((item) => item.id) } }));
    if (error)
        return;
    draft.value = addWidget(draft.value, id);
    justAdded.value = id;
    announcement.value = t('admin.dashboard.added', { widget: label(id) });
    await nextTick();
    document.getElementById(`dashboard-widget-${id}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' });
}
function remove(id) {
    draft.value = removeWidget(draft.value, id);
    announcement.value = t('admin.dashboard.removed', { widget: label(id) });
}
async function persist(next, clear = false) {
    isSaving.value = true;
    try {
        const [error] = await catchError(updatePreferences({ adminDashboardGrid: clear ? null : next }));
        if (error) {
            notify.error(describeRequestError(error, t('admin.dashboard.saveError')));
        }
        else {
            saved.value = next.map((item) => ({ ...item }));
            editing.value = false;
            notify.success(t('admin.dashboard.saved'));
        }
    }
    finally {
        isSaving.value = false;
    }
}
const save = () => persist(draft.value);
const reset = () => persist(DEFAULT_GRID.map((item) => ({ ...item })), true);
const editorActions = computed(() => [
    { id: 'add-panel', label: t('admin.dashboard.addPanel'), disabled: isSaving.value, run: addPanel },
    { id: 'reset', label: t('admin.dashboard.reset'), disabled: isSaving.value || (isDefaultGrid(draft.value) && isDefaultGrid(saved.value)), run: reset },
    { id: 'save', label: t('admin.dashboard.save'), disabled: isSaving.value || !changed.value, run: save },
]);
function toggleEditorActions() {
    if (editing.value)
        cancel();
    else
        startEditing();
}
async function load() {
    try {
        const [error, result] = await catchError(getAdminOverview());
        if (error) {
            console.error('[overview] failed to load', error);
            loadError.value = describeRequestError(error, t('admin.overview.loadError'));
        }
        else {
            overview.value = result;
            loadError.value = '';
        }
    }
    finally {
        isLoading.value = false;
    }
}
onMounted(() => {
    void load();
    getPreferences()
        .then((preferences) => {
        if (!editing.value)
            saved.value = normalizeGrid(preferences.adminDashboardGrid);
    })
        .catch((error) => console.error('[dashboard] failed to load layout', error))
        .finally(() => {
        isLayoutLoading.value = false;
    });
});
onBeforeUnmount(() => stopGesture?.());
const live = useLiveTopic('overview');
watch(live.data, (value) => {
    if (!value)
        return;
    overview.value = value;
    loadError.value = '';
    isLoading.value = false;
});
const __VLS_ctx = {};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
void __VLS_ctx, __VLS_components, __VLS_intrinsics, __VLS_directives;
const __VLS_template = () => {
    __VLS_withDotValue(editing, {});
    __VLS_withDotValue(editorActions, {});
    __VLS_withDotValue(loadError, {});
    __VLS_withDotValue(layout, {});
    __VLS_withDotValue(gesture, {});
    __VLS_withDotValue(justAdded, {});
    __VLS_withDotValue(orderOf, {});
    __VLS_withDotValue(overview, {});
    __VLS_withDotValue(isLoading, {});
    __VLS_withDotValue(isLayoutLoading, {});
    __VLS_withDotValue(COMPONENTS, {});
    __VLS_withDotValue(STANDALONE, {});
    void {};
    /** @type {__VLS_StyleScopedClasses['dash-grid']} */ ;
    /** @type {__VLS_StyleScopedClasses['dash-cell']} */ ;
    /** @type {__VLS_StyleScopedClasses['dashboard-move-move']} */ ;
    /** @type {__VLS_StyleScopedClasses['fab-pop-enter-active']} */ ;
    /** @type {__VLS_StyleScopedClasses['fab-pop-leave-active']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex flex-col gap-5" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-5']} */ ;
    let __VLS_0;
    /** @ts-ignore @type { | typeof __VLS_components.Teleport | typeof __VLS_components.Teleport} */
    Teleport;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
        // @ts-ignore
        defer: true, to: "#admin-header-actions",
    }));
    const __VLS_2 = __VLS_1({
        defer: true,
        to: "#admin-header-actions",
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    var __VLS_3;
    const { default: __VLS_5 } = __VLS_nonNull(__VLS_3.slots);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "fixed bottom-6 right-6 z-40 flex flex-col items-end gap-1" },
    });
    /** @type {__VLS_StyleScopedClasses['fixed']} */ ;
    /** @type {__VLS_StyleScopedClasses['bottom-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['right-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['z-40']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-end']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
    let __VLS_6;
    /** @ts-ignore @type { | typeof __VLS_components.TransitionGroup | typeof __VLS_components.TransitionGroup} */
    TransitionGroup;
    // @ts-ignore
    const __VLS_7 = __VLS_asFunctionalComponent1(__VLS_6, new __VLS_6({
        // @ts-ignore
        id: "admin-layout-actions", name: "fab-pop", tag: "div", ...{ class: "flex flex-col items-end gap-1" },
    }));
    const __VLS_8 = __VLS_7({
        id: "admin-layout-actions",
        name: "fab-pop",
        tag: "div",
        ...{ class: "flex flex-col items-end gap-1" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_7));
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-end']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
    var __VLS_9;
    const { default: __VLS_11 } = __VLS_nonNull(__VLS_9.slots);
    const __VLS_12 = __VLS_tryAsConstant(((editing.value ? editorActions.value : [])));
    for (const [action, index] of __VLS_vFor(__VLS_nonNull(__VLS_12))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (action.run) },
            key: (action.id),
            type: "button",
            ...{ class: "group inline-flex size-14 items-center justify-center" },
            'aria-label': (action.label),
            title: (action.label),
            disabled: (action.disabled),
            ...{ style: ({ '--action-delay': `${(editorActions.value.length - index - 1) * 45}ms` }) },
        });
        /** @type {__VLS_StyleScopedClasses['group']} */ ;
        /** @type {__VLS_StyleScopedClasses['inline-flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['size-14']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "inline-flex size-12 items-center justify-center rounded-full bg-flixer-primary text-white shadow-lg shadow-black/40 transition group-hover:bg-flixer-primary/80 group-disabled:opacity-50" },
        });
        /** @type {__VLS_StyleScopedClasses['inline-flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['size-12']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-flixer-primary']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
        /** @type {__VLS_StyleScopedClasses['shadow-lg']} */ ;
        /** @type {__VLS_StyleScopedClasses['shadow-black/40']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition']} */ ;
        /** @type {__VLS_StyleScopedClasses['group-hover:bg-flixer-primary/80']} */ ;
        /** @type {__VLS_StyleScopedClasses['group-disabled:opacity-50']} */ ;
        if (action.id === 'add-panel') {
            let __VLS_13;
            /** @ts-ignore @type { | typeof __VLS_components.Icon} */
            Icon;
            // @ts-ignore
            const __VLS_14 = __VLS_asFunctionalComponent1(__VLS_13, new __VLS_13({
                // @ts-ignore
                icon: "lucide:plus", ...{ class: "size-5" }, 'aria-hidden': "true",
            }));
            const __VLS_15 = __VLS_14({
                icon: "lucide:plus",
                ...{ class: "size-5" },
                'aria-hidden': "true",
            }, ...__VLS_functionalComponentArgsRest(__VLS_14));
            /** @type {__VLS_StyleScopedClasses['size-5']} */ ;
        }
        else if (action.id === 'reset') {
            let __VLS_18;
            /** @ts-ignore @type { | typeof __VLS_components.Icon} */
            Icon;
            // @ts-ignore
            const __VLS_19 = __VLS_asFunctionalComponent1(__VLS_18, new __VLS_18({
                // @ts-ignore
                icon: "lucide:rotate-ccw", ...{ class: "size-5" }, 'aria-hidden': "true",
            }));
            const __VLS_20 = __VLS_19({
                icon: "lucide:rotate-ccw",
                ...{ class: "size-5" },
                'aria-hidden': "true",
            }, ...__VLS_functionalComponentArgsRest(__VLS_19));
            /** @type {__VLS_StyleScopedClasses['size-5']} */ ;
        }
        else {
            let __VLS_23;
            /** @ts-ignore @type { | typeof __VLS_components.Icon} */
            Icon;
            // @ts-ignore
            const __VLS_24 = __VLS_asFunctionalComponent1(__VLS_23, new __VLS_23({
                // @ts-ignore
                icon: "lucide:check", ...{ class: "size-5" }, 'aria-hidden': "true",
            }));
            const __VLS_25 = __VLS_24({
                icon: "lucide:check",
                ...{ class: "size-5" },
                'aria-hidden': "true",
            }, ...__VLS_functionalComponentArgsRest(__VLS_24));
            /** @type {__VLS_StyleScopedClasses['size-5']} */ ;
        }
        // @ts-ignore
        [editing, editorActions, editorActions,];
    }
    // @ts-ignore
    [];
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (toggleEditorActions) },
        type: "button",
        ...{ class: "inline-flex size-14 items-center justify-center rounded-full bg-flixer-accent text-white shadow-xl shadow-black/40 transition hover:bg-flixer-accent/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent" },
        'aria-label': (__VLS_unwrap(t, {})(editing.value ? 'admin.dashboard.cancel' : 'admin.dashboard.customize')),
        'aria-expanded': (editing.value),
        'aria-controls': "admin-layout-actions",
        title: (__VLS_unwrap(t, {})(editing.value ? 'admin.dashboard.cancel' : 'admin.dashboard.customize')),
    });
    /** @type {__VLS_StyleScopedClasses['inline-flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['size-14']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-flixer-accent']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
    /** @type {__VLS_StyleScopedClasses['shadow-xl']} */ ;
    /** @type {__VLS_StyleScopedClasses['shadow-black/40']} */ ;
    /** @type {__VLS_StyleScopedClasses['transition']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:bg-flixer-accent/80']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-offset-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
    let __VLS_28;
    /** @ts-ignore @type { | typeof __VLS_components.Icon} */
    Icon;
    // @ts-ignore
    const __VLS_29 = __VLS_asFunctionalComponent1(__VLS_28, new __VLS_28({
        // @ts-ignore
        icon: (editing.value ? 'lucide:x' : 'lucide:layout-dashboard'), ...{ class: "size-6" }, 'aria-hidden': "true",
    }));
    const __VLS_30 = __VLS_29({
        icon: (editing.value ? 'lucide:x' : 'lucide:layout-dashboard'),
        ...{ class: "size-6" },
        'aria-hidden': "true",
    }, ...__VLS_functionalComponentArgsRest(__VLS_29));
    /** @type {__VLS_StyleScopedClasses['size-6']} */ ;
    // @ts-ignore
    [editing, editing, editing, editing, t, t,];
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "sr-only" },
        role: "status",
        'aria-live': "polite",
    });
    /** @type {__VLS_StyleScopedClasses['sr-only']} */ ;
    (__VLS_unwrap(announcement, {}));
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        id: "dashboard-keys",
        ...{ class: "sr-only" },
    });
    /** @type {__VLS_StyleScopedClasses['sr-only']} */ ;
    (__VLS_unwrap(t, {})('admin.dashboard.keyboardHint'));
    if (loadError.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            role: "alert",
            ...{ class: "rounded border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200" },
        });
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-red-400/30']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-red-500/10']} */ ;
        /** @type {__VLS_StyleScopedClasses['p-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-red-200']} */ ;
        (loadError.value);
    }
    if (layout.value.length === 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "admin-card p-10 text-center text-sm text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['admin-card']} */ ;
        /** @type {__VLS_StyleScopedClasses['p-10']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (__VLS_unwrap(t, {})(editing.value ? 'admin.dashboard.emptyEditing' : 'admin.dashboard.empty'));
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ref: "gridEl",
    });
    let __VLS_33;
    /** @ts-ignore @type { | typeof __VLS_components.TransitionGroup | typeof __VLS_components.TransitionGroup} */
    TransitionGroup;
    // @ts-ignore
    const __VLS_34 = __VLS_asFunctionalComponent1(__VLS_33, new __VLS_33({
        // @ts-ignore
        tag: "div", name: "dashboard-move", ...{ class: "dash-grid" }, ...{ class: (editing.value && 'dash-grid-editing') }, ...{ style: ({ '--rows': __VLS_unwrap(rows, {}) }) },
    }));
    const __VLS_35 = __VLS_34({
        tag: "div",
        name: "dashboard-move",
        ...{ class: "dash-grid" },
        ...{ class: (editing.value && 'dash-grid-editing') },
        ...{ style: ({ '--rows': __VLS_unwrap(rows, {}) }) },
    }, ...__VLS_functionalComponentArgsRest(__VLS_34));
    /** @type {__VLS_StyleScopedClasses['dash-grid']} */ ;
    var __VLS_36;
    const { default: __VLS_38 } = __VLS_nonNull(__VLS_36.slots);
    const __VLS_39 = __VLS_tryAsConstant((layout.value));
    for (const [item] of __VLS_vFor(__VLS_nonNull(__VLS_39))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            id: (`dashboard-widget-${item.id}`),
            key: (item.id),
            'data-widget': true,
            ...{ class: "dash-cell relative min-w-0 rounded transition-shadow" },
            ...{ class: ([editing.value && 'ring-1 ring-flixer-accent/40', editing.value && gesture.value?.id === item.id && 'z-10 ring-2 ring-flixer-accent', editing.value && justAdded.value === item.id && 'ring-2 ring-emerald-400']) },
            ...{ style: ({ '--x': item.x, '--y': item.y, '--w': item.w, '--h': item.h, '--o': orderOf.value.get(item.id) }) },
        });
        /** @type {__VLS_StyleScopedClasses['dash-cell']} */ ;
        /** @type {__VLS_StyleScopedClasses['relative']} */ ;
        /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition-shadow']} */ ;
        if (editing.value) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "pointer-events-none absolute inset-x-2 top-2 z-10 flex items-center justify-between gap-2" },
            });
            /** @type {__VLS_StyleScopedClasses['pointer-events-none']} */ ;
            /** @type {__VLS_StyleScopedClasses['absolute']} */ ;
            /** @type {__VLS_StyleScopedClasses['inset-x-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['top-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['z-10']} */ ;
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onPointerdown: (...[$event]) => {
                        void $event;
                        if (!(editing.value))
                            throw 0;
                        return (startMove(item.id, $event));
                        // @ts-ignore
                        [editing, editing, editing, editing, editing, editing, t, t, announcement, loadError, loadError, layout, layout, rows, gesture, justAdded, orderOf,];
                    } },
                ...{ onKeydown: (...[$event]) => {
                        void $event;
                        if (!(editing.value))
                            throw 0;
                        return (onHandleKey(item.id, $event));
                        // @ts-ignore
                        [];
                    } },
                type: "button",
                ...{ class: "pointer-events-auto flex min-w-0 cursor-grab touch-none items-center gap-2 rounded bg-flixer-background/90 px-2 py-1.5 text-xs shadow-lg backdrop-blur font-semibold text-flixer-accent focus-visible:outline-2 focus-visible:outline-flixer-accent active:cursor-grabbing" },
                'aria-describedby': "dashboard-keys",
                'aria-label': (__VLS_unwrap(t, {})('admin.dashboard.dragHandle', { widget: __VLS_unwrap(label, {})(item.id) })),
            });
            /** @type {__VLS_StyleScopedClasses['pointer-events-auto']} */ ;
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
            /** @type {__VLS_StyleScopedClasses['cursor-grab']} */ ;
            /** @type {__VLS_StyleScopedClasses['touch-none']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-flixer-background/90']} */ ;
            /** @type {__VLS_StyleScopedClasses['px-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-1.5']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['shadow-lg']} */ ;
            /** @type {__VLS_StyleScopedClasses['backdrop-blur']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-accent']} */ ;
            /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
            /** @type {__VLS_StyleScopedClasses['active:cursor-grabbing']} */ ;
            let __VLS_40;
            /** @ts-ignore @type { | typeof __VLS_components.Icon} */
            Icon;
            // @ts-ignore
            const __VLS_41 = __VLS_asFunctionalComponent1(__VLS_40, new __VLS_40({
                // @ts-ignore
                icon: "lucide:grip", ...{ class: "h-4 w-4 shrink-0" }, 'aria-hidden': "true",
            }));
            const __VLS_42 = __VLS_41({
                icon: "lucide:grip",
                ...{ class: "h-4 w-4 shrink-0" },
                'aria-hidden': "true",
            }, ...__VLS_functionalComponentArgsRest(__VLS_41));
            /** @type {__VLS_StyleScopedClasses['h-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['w-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "truncate" },
            });
            /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
            (__VLS_unwrap(label, {})(item.id));
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        void $event;
                        if (!(editing.value))
                            throw 0;
                        return (remove(item.id));
                        // @ts-ignore
                        [t, label, label,];
                    } },
                type: "button",
                ...{ class: ([__VLS_unwrap(iconButton, {}), 'pointer-events-auto bg-flixer-background/90 shadow-lg']) },
                'aria-label': (__VLS_unwrap(t, {})('admin.dashboard.remove', { widget: __VLS_unwrap(label, {})(item.id) })),
            });
            /** @type {__VLS_StyleScopedClasses['pointer-events-auto']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-flixer-background/90']} */ ;
            /** @type {__VLS_StyleScopedClasses['shadow-lg']} */ ;
            let __VLS_45;
            /** @ts-ignore @type { | typeof __VLS_components.Icon} */
            Icon;
            // @ts-ignore
            const __VLS_46 = __VLS_asFunctionalComponent1(__VLS_45, new __VLS_45({
                // @ts-ignore
                icon: "lucide:x", ...{ class: "size-4" }, 'aria-hidden': "true",
            }));
            const __VLS_47 = __VLS_46({
                icon: "lucide:x",
                ...{ class: "size-4" },
                'aria-hidden': "true",
            }, ...__VLS_functionalComponentArgsRest(__VLS_46));
            /** @type {__VLS_StyleScopedClasses['size-4']} */ ;
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: (editing.value && 'pointer-events-none select-none') },
            ...{ class: "h-full lg:*:h-full lg:*:overflow-auto" },
            inert: (editing.value),
        });
        /** @type {__VLS_StyleScopedClasses['h-full']} */ ;
        /** @type {__VLS_StyleScopedClasses['lg:*:h-full']} */ ;
        /** @type {__VLS_StyleScopedClasses['lg:*:overflow-auto']} */ ;
        if (!overview.value && (isLoading.value || isLayoutLoading.value)) {
            const __VLS_50 = DashboardWidgetSkeleton;
            // @ts-ignore
            const __VLS_51 = __VLS_asFunctionalComponent1(__VLS_50, new __VLS_50({
                // @ts-ignore
                widget: (item.id),
            }));
            const __VLS_52 = __VLS_51({
                widget: (item.id),
            }, ...__VLS_functionalComponentArgsRest(__VLS_51));
        }
        else if (__VLS_unwrap(needsOverview, {})(item.id)) {
            if (overview.value) {
                const __VLS_55 = (COMPONENTS.value[item.id]);
                // @ts-ignore
                const __VLS_56 = __VLS_asFunctionalComponent1(__VLS_55, new __VLS_55({
                    // @ts-ignore
                    overview: (overview.value),
                }));
                const __VLS_57 = __VLS_56({
                    overview: (overview.value),
                }, ...__VLS_functionalComponentArgsRest(__VLS_56));
            }
        }
        else if (__VLS_unwrap(standalone, {})(item.id)) {
            const __VLS_60 = (STANDALONE.value[item.id]);
            // @ts-ignore
            const __VLS_61 = __VLS_asFunctionalComponent1(__VLS_60, new __VLS_60({
            // @ts-ignore
            }));
            const __VLS_62 = __VLS_61({}, ...__VLS_functionalComponentArgsRest(__VLS_61));
        }
        else if (item.id === 'streams') {
            const __VLS_65 = StreamSessionsPanel;
            // @ts-ignore
            const __VLS_66 = __VLS_asFunctionalComponent1(__VLS_65, new __VLS_65({
            // @ts-ignore
            }));
            const __VLS_67 = __VLS_66({}, ...__VLS_functionalComponentArgsRest(__VLS_66));
        }
        else if (item.id === 'logs') {
            const __VLS_70 = LogsPanel;
            // @ts-ignore
            const __VLS_71 = __VLS_asFunctionalComponent1(__VLS_70, new __VLS_70({
            // @ts-ignore
            }));
            const __VLS_72 = __VLS_71({}, ...__VLS_functionalComponentArgsRest(__VLS_71));
        }
        if (editing.value) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ onPointerdown: (...[$event]) => {
                        void $event;
                        if (!(editing.value))
                            throw 0;
                        return (startResize(item.id, { width: true }, $event));
                        // @ts-ignore
                        [editing, editing, editing, t, label, iconButton, overview, overview, overview, isLoading, isLayoutLoading, needsOverview, COMPONENTS, standalone, STANDALONE,];
                    } },
                ...{ class: ([__VLS_unwrap(resizeHandle, {}), '-right-3 inset-y-6 w-4 cursor-ew-resize']) },
                role: "presentation",
                title: (__VLS_unwrap(t, {})('admin.dashboard.dragToResize')),
            });
            /** @type {__VLS_StyleScopedClasses['-right-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['inset-y-6']} */ ;
            /** @type {__VLS_StyleScopedClasses['w-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['cursor-ew-resize']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "h-10 w-1.5 rounded-full bg-flixer-accent/70" },
            });
            /** @type {__VLS_StyleScopedClasses['h-10']} */ ;
            /** @type {__VLS_StyleScopedClasses['w-1.5']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-flixer-accent/70']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ onPointerdown: (...[$event]) => {
                        void $event;
                        if (!(editing.value))
                            throw 0;
                        return (startResize(item.id, { height: true }, $event));
                        // @ts-ignore
                        [t, resizeHandle,];
                    } },
                ...{ class: ([__VLS_unwrap(resizeHandle, {}), '-bottom-3 inset-x-6 h-4 cursor-ns-resize']) },
                role: "presentation",
                title: (__VLS_unwrap(t, {})('admin.dashboard.dragToResize')),
            });
            /** @type {__VLS_StyleScopedClasses['-bottom-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['inset-x-6']} */ ;
            /** @type {__VLS_StyleScopedClasses['h-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['cursor-ns-resize']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "h-1.5 w-10 rounded-full bg-flixer-accent/70" },
            });
            /** @type {__VLS_StyleScopedClasses['h-1.5']} */ ;
            /** @type {__VLS_StyleScopedClasses['w-10']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-flixer-accent/70']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ onPointerdown: (...[$event]) => {
                        void $event;
                        if (!(editing.value))
                            throw 0;
                        return (startResize(item.id, { width: true, height: true }, $event));
                        // @ts-ignore
                        [t, resizeHandle,];
                    } },
                ...{ class: ([__VLS_unwrap(resizeHandle, {}), '-right-3 -bottom-3 h-6 w-6 cursor-nwse-resize']) },
                role: "presentation",
                title: (__VLS_unwrap(t, {})('admin.dashboard.dragToResize')),
            });
            /** @type {__VLS_StyleScopedClasses['-right-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['-bottom-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['h-6']} */ ;
            /** @type {__VLS_StyleScopedClasses['w-6']} */ ;
            /** @type {__VLS_StyleScopedClasses['cursor-nwse-resize']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "h-3 w-3 rounded-full bg-flixer-accent" },
            });
            /** @type {__VLS_StyleScopedClasses['h-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['w-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-flixer-accent']} */ ;
        }
        // @ts-ignore
        [t, resizeHandle,];
    }
    // @ts-ignore
    [];
    // @ts-ignore
    [];
    return {};
};
void [__VLS_template];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
