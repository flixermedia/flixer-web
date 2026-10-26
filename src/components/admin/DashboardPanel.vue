<script setup lang="ts">
import { openModal } from '@kolirt/vue-modal'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { getAdminOverview, getPreferences, updatePreferences, type AdminOverview } from '../../api'
import { notify } from '../../composables/notify'
import { useLiveTopic } from '../../composables/useLive'
import { describeRequestError } from '../../composables/useProfile'
import ActivityWidget from './dashboard/ActivityWidget.vue'
import AddWidgetModal from './AddWidgetModal.vue'
import BackupsWidget from './dashboard/BackupsWidget.vue'
import ContentMixWidget from './dashboard/ContentMixWidget.vue'
import LibrariesWidget from './dashboard/LibrariesWidget.vue'
import QueuesWidget from './dashboard/QueuesWidget.vue'
import RequestsWidget from './dashboard/RequestsWidget.vue'
import ServicesWidget from './dashboard/ServicesWidget.vue'
import ShortcutsWidget from './dashboard/ShortcutsWidget.vue'
import TranscodingWidget from './dashboard/TranscodingWidget.vue'
import UpdatesWidget from './dashboard/UpdatesWidget.vue'
import UptimeWidget from './dashboard/UptimeWidget.vue'
import UsersWidget from './dashboard/UsersWidget.vue'
import { GRID_COLUMNS } from './dashboard/dashboardCatalog'
import { DEFAULT_GRID, addWidget, isDefaultGrid, normalizeGrid, placeWidget, removeWidget, rowCount, sameGrid, type DashboardWidgetId, type GridItem } from './dashboard/dashboardLayout'
import ServerWidget from './dashboard/ServerWidget.vue'
import StatsWidget from './dashboard/StatsWidget.vue'
import StorageWidget from './dashboard/StorageWidget.vue'
import AdminSkeleton from './AdminSkeleton.vue'
import LogsPanel from './LogsPanel.vue'
import StreamSessionsPanel from './StreamSessionsPanel.vue'

const { t } = useI18n()

// Must match the grid CSS below: rows are half a row (96px) tall with a 16px gap between all cells.
const ROW_UNIT = 96
const GAP = 16
const EXTRA_ROWS = 6

const overview = ref<AdminOverview | null>(null)
const isLoading = ref(true)
const loadError = ref('')

const saved = ref<GridItem[]>(normalizeGrid(undefined))
const draft = ref<GridItem[]>([])
const editing = ref(false)
const isSaving = ref(false)
const announcement = ref('')
const justAdded = ref<DashboardWidgetId | null>(null)
const gridEl = ref<HTMLElement | null>(null)

interface Gesture {
  id: DashboardWidgetId
  patch: Partial<Omit<GridItem, 'id'>>
}
const gesture = ref<Gesture | null>(null)
let stopGesture: (() => void) | undefined

// While a gesture is in progress the grid shows where the panel would land and which panels it pushes aside.
const layout = computed(() => {
  if (!editing.value) return saved.value
  return gesture.value ? placeWidget(draft.value, gesture.value.id, gesture.value.patch) : draft.value
})
const orderOf = computed(() => new Map([...layout.value].sort((a, b) => a.y - b.y || a.x - b.x).map((item, index) => [item.id, index])))
const rows = computed(() => rowCount(layout.value) + (editing.value ? EXTRA_ROWS : 0))
const changed = computed(() => !sameGrid(draft.value, saved.value))

const COMPONENTS = { stats: StatsWidget, server: ServerWidget, storage: StorageWidget, activity: ActivityWidget, uptime: UptimeWidget, transcoding: TranscodingWidget, libraries: LibrariesWidget, 'content-mix': ContentMixWidget, services: ServicesWidget } as const
const STANDALONE = { queues: QueuesWidget, updates: UpdatesWidget, backups: BackupsWidget, requests: RequestsWidget, users: UsersWidget, shortcuts: ShortcutsWidget } as const
const needsOverview = (id: DashboardWidgetId): id is keyof typeof COMPONENTS => id in COMPONENTS
const standalone = (id: DashboardWidgetId): id is keyof typeof STANDALONE => id in STANDALONE

const iconButton = 'inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-sm transition hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-flixer-accent disabled:opacity-30'
const quietButton = 'rounded-lg bg-white/10 px-4 py-1.5 text-xs font-semibold transition hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-flixer-accent disabled:opacity-60'
const primaryButton = 'rounded-lg bg-flixer-primary px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-flixer-primary/80 focus-visible:outline-2 focus-visible:outline-flixer-accent disabled:opacity-60'
const resizeHandle = 'absolute z-20 hidden items-center justify-center touch-none lg:flex'

const label = (id: DashboardWidgetId) => t(`admin.dashboard.widgets.${id}`)
const isWide = () => window.matchMedia('(min-width: 1024px)').matches
const find = (id: DashboardWidgetId) => draft.value.find((item) => item.id === id)

function announce(id: DashboardWidgetId) {
  const item = find(id)
  if (item) announcement.value = t('admin.dashboard.placed', { widget: label(id), column: item.x + 1, row: item.y + 1, width: item.w, height: item.h })
}

function startEditing() {
  justAdded.value = null
  draft.value = saved.value.map((item) => ({ ...item }))
  editing.value = true
}

function cancel() {
  stopGesture?.()
  editing.value = false
}

function geometry() {
  const box = gridEl.value!.getBoundingClientRect()
  return { left: box.left, top: box.top, pitchX: (box.width + GAP) / GRID_COLUMNS, pitchY: ROW_UNIT + GAP }
}

/** Follows the pointer until it is released, then applies the result. Escape abandons it. */
function track(id: DashboardWidgetId, patchFor: (event: PointerEvent) => Gesture['patch']) {
  stopGesture?.()
  const onMove = (event: PointerEvent) => {
    gesture.value = { id, patch: patchFor(event) }
  }
  const finish = (apply: boolean) => {
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onUp)
    window.removeEventListener('pointercancel', onCancel)
    window.removeEventListener('keydown', onKey)
    if (apply && gesture.value) {
      draft.value = placeWidget(draft.value, id, gesture.value.patch)
      announce(id)
    }
    gesture.value = null
    stopGesture = undefined
  }
  const onUp = () => finish(true)
  const onCancel = () => finish(false)
  const onKey = (event: KeyboardEvent) => event.key === 'Escape' && finish(false)
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onUp)
  window.addEventListener('pointercancel', onCancel)
  window.addEventListener('keydown', onKey)
  stopGesture = () => finish(false)
}

function startMove(id: DashboardWidgetId, event: PointerEvent) {
  const item = find(id)
  const card = (event.currentTarget as HTMLElement).closest<HTMLElement>('[data-widget]')
  if (!item || !card || !gridEl.value || !isWide() || event.button !== 0) return
  event.preventDefault()
  const box = card.getBoundingClientRect()
  const grabX = event.clientX - box.left
  const grabY = event.clientY - box.top
  track(id, (move) => {
    const { left, top, pitchX, pitchY } = geometry()
    return { x: Math.round((move.clientX - grabX - left) / pitchX), y: Math.round((move.clientY - grabY - top) / pitchY) }
  })
}

function startResize(id: DashboardWidgetId, edges: { width?: boolean; height?: boolean }, event: PointerEvent) {
  const item = find(id)
  if (!item || !gridEl.value || event.button !== 0) return
  event.preventDefault()
  track(id, (move) => {
    const { left, top, pitchX, pitchY } = geometry()
    const patch: Gesture['patch'] = {}
    if (edges.width) patch.w = Math.min(GRID_COLUMNS - item.x, Math.max(1, Math.round((move.clientX - left - item.x * pitchX + GAP) / pitchX)))
    if (edges.height) patch.h = Math.max(1, Math.round((move.clientY - top - item.y * pitchY + GAP) / pitchY))
    return patch
  })
}

const ARROWS: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }

// Arrow keys move a focused panel one cell at a time; with Shift they resize it instead.
function onHandleKey(id: DashboardWidgetId, event: KeyboardEvent) {
  const step = ARROWS[event.key]
  const item = find(id)
  if (!step || !item) return
  event.preventDefault()
  draft.value = event.shiftKey
    ? placeWidget(draft.value, id, { w: Math.min(GRID_COLUMNS - item.x, item.w + step[0]), h: item.h + step[1] })
    : placeWidget(draft.value, id, { x: item.x + step[0], y: item.y + step[1] })
  announce(id)
}

async function addPanel() {
  try {
    const id = await openModal<DashboardWidgetId>(AddWidgetModal, { props: { added: draft.value.map((item) => item.id) } })
    draft.value = addWidget(draft.value, id)
    justAdded.value = id
    announcement.value = t('admin.dashboard.added', { widget: label(id) })
    await nextTick()
    document.getElementById(`dashboard-widget-${id}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  } catch {
    // modal dismissed without choosing a panel
  }
}

function remove(id: DashboardWidgetId) {
  draft.value = removeWidget(draft.value, id)
  announcement.value = t('admin.dashboard.removed', { widget: label(id) })
}

async function persist(next: GridItem[], clear = false) {
  isSaving.value = true
  try {
    await updatePreferences({ adminDashboardGrid: clear ? null : next })
    saved.value = next.map((item) => ({ ...item }))
    editing.value = false
    notify.success(t('admin.dashboard.saved'))
  } catch (error: unknown) {
    notify.error(describeRequestError(error, t('admin.dashboard.saveError')))
  } finally {
    isSaving.value = false
  }
}

const save = () => persist(draft.value)
const reset = () => persist(DEFAULT_GRID.map((item) => ({ ...item })), true)

async function load() {
  try {
    overview.value = await getAdminOverview()
    loadError.value = ''
  } catch (error: unknown) {
    console.error('[overview] failed to load', error)
    loadError.value = describeRequestError(error, t('admin.overview.loadError'))
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  void load()
  getPreferences()
    .then((preferences) => {
      if (!editing.value) saved.value = normalizeGrid(preferences.adminDashboardGrid)
    })
    .catch((error: unknown) => console.error('[dashboard] failed to load layout', error))
})

onBeforeUnmount(() => stopGesture?.())

const live = useLiveTopic<AdminOverview>('overview')
watch(live.data, (value) => {
  if (!value) return
  overview.value = value
  loadError.value = ''
  isLoading.value = false
})
</script>

<template>
  <div class="flex flex-col gap-5">
    <Teleport defer to="#admin-header-actions">
    <div class="hidden flex-wrap items-center justify-end gap-2 lg:flex">
      <template v-if="editing">
        <button type="button" :class="primaryButton" :disabled="isSaving" @click="addPanel">{{ t('admin.dashboard.addPanel') }}</button>
        <button type="button" :class="quietButton" :disabled="isSaving || (isDefaultGrid(draft) && isDefaultGrid(saved))" @click="reset">{{ t('admin.dashboard.reset') }}</button>
        <button type="button" :class="quietButton" :disabled="isSaving" @click="cancel">{{ t('admin.dashboard.cancel') }}</button>
        <button type="button" :class="primaryButton" :disabled="isSaving || !changed" @click="save">{{ t('admin.dashboard.save') }}</button>
      </template>
      <button v-else type="button" :class="quietButton" @click="startEditing">{{ t('admin.dashboard.customize') }}</button>
    </div>
    </Teleport>

    <p class="sr-only" role="status" aria-live="polite">{{ announcement }}</p>
    <p id="dashboard-keys" class="sr-only">{{ t('admin.dashboard.keyboardHint') }}</p>
    <p v-if="loadError" role="alert" class="rounded border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200">{{ loadError }}</p>
    <p v-if="layout.length === 0" class="admin-card p-10 text-center text-sm text-flixer-muted">{{ t(editing ? 'admin.dashboard.emptyEditing' : 'admin.dashboard.empty') }}</p>

    <div ref="gridEl">
    <TransitionGroup tag="div" name="dashboard-move" class="dash-grid" :class="editing && 'dash-grid-editing'" :style="{ '--rows': rows }">
      <div v-for="item in layout" :id="`dashboard-widget-${item.id}`" :key="item.id" data-widget class="dash-cell relative min-w-0 rounded transition-shadow" :class="[editing && 'ring-1 ring-flixer-accent/40', editing && gesture?.id === item.id && 'z-10 ring-2 ring-flixer-accent', editing && justAdded === item.id && 'ring-2 ring-emerald-400']" :style="{ '--x': item.x, '--y': item.y, '--w': item.w, '--h': item.h, '--o': orderOf.get(item.id) }">
        <div v-if="editing" class="pointer-events-none absolute inset-x-2 top-2 z-10 flex items-center justify-between gap-2">
          <button type="button" class="pointer-events-auto flex min-w-0 cursor-grab touch-none items-center gap-2 rounded-lg bg-flixer-background/90 px-2 py-1.5 text-xs shadow-lg backdrop-blur font-semibold text-flixer-accent focus-visible:outline-2 focus-visible:outline-flixer-accent active:cursor-grabbing" aria-describedby="dashboard-keys" :aria-label="t('admin.dashboard.dragHandle', { widget: label(item.id) })" @pointerdown="startMove(item.id, $event)" @keydown="onHandleKey(item.id, $event)">
            <svg class="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M7 4a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm0 6a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm-1.5 7.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM16 4a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm-1.5 7.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM16 17a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" /></svg>
            <span class="truncate">{{ label(item.id) }}</span>
          </button>
          <button type="button" :class="[iconButton, 'pointer-events-auto bg-flixer-background/90 shadow-lg']" :aria-label="t('admin.dashboard.remove', { widget: label(item.id) })" @click="remove(item.id)">✕</button>
        </div>

        <div :class="editing && 'pointer-events-none select-none'" class="h-full lg:*:h-full lg:*:overflow-auto" :inert="editing">
          <template v-if="needsOverview(item.id)">
            <AdminSkeleton v-if="!overview && isLoading" variant="stats" />
            <component :is="COMPONENTS[item.id]" v-else-if="overview" :overview="overview" />
          </template>
          <component :is="STANDALONE[item.id]" v-else-if="standalone(item.id)" />
          <StreamSessionsPanel v-else-if="item.id === 'streams'" />
          <LogsPanel v-else-if="item.id === 'logs'" />
        </div>

        <template v-if="editing">
          <div :class="[resizeHandle, '-right-3 inset-y-6 w-4 cursor-ew-resize']" role="presentation" :title="t('admin.dashboard.dragToResize')" @pointerdown="startResize(item.id, { width: true }, $event)"><span class="h-10 w-1.5 rounded-full bg-flixer-accent/70"></span></div>
          <div :class="[resizeHandle, '-bottom-3 inset-x-6 h-4 cursor-ns-resize']" role="presentation" :title="t('admin.dashboard.dragToResize')" @pointerdown="startResize(item.id, { height: true }, $event)"><span class="h-1.5 w-10 rounded-full bg-flixer-accent/70"></span></div>
          <div :class="[resizeHandle, '-right-3 -bottom-3 h-6 w-6 cursor-nwse-resize']" role="presentation" :title="t('admin.dashboard.dragToResize')" @pointerdown="startResize(item.id, { width: true, height: true }, $event)"><span class="h-3 w-3 rounded-full bg-flixer-accent"></span></div>
        </template>
      </div>
    </TransitionGroup>
    </div>
  </div>
</template>

<style scoped>
/* Below the lg breakpoint panels simply stack in reading order at their natural height. */
.dash-grid {
  display: grid;
  gap: 16px;
}
.dash-cell {
  order: var(--o);
}
@media (min-width: 1024px) {
  .dash-grid {
    grid-template-columns: repeat(5, minmax(0, 1fr));
    grid-template-rows: repeat(var(--rows), 96px);
  }
  .dash-grid-editing {
    background-image: linear-gradient(to bottom, rgb(255 255 255 / 0.04) 1px, transparent 1px);
    background-size: 100% 112px;
  }
  .dash-cell {
    order: 0;
    grid-column: calc(var(--x) + 1) / span var(--w);
    grid-row: calc(var(--y) + 1) / span var(--h);
  }
}
.dashboard-move-move {
  transition: transform 0.2s ease;
}
@media (prefers-reduced-motion: reduce) {
  .dashboard-move-move {
    transition: none;
  }
}
</style>
