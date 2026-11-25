<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { defaultPagePosition, type PageBlock, type PageBlockType, type PagePosition } from './pageBuilder'
import PageBlockView from './PageBlockView.vue'

const props = defineProps<{ blocks: PageBlock[]; editable?: boolean; selectedId?: string; editingId?: string; layout?: 'flow' | 'free'; viewport?: 'desktop' | 'mobile'; zoom?: number }>()
const emit = defineEmits<{ select: [id: string]; edit: [id: string]; text: [id: string, value: string]; move: [id: string, viewport: 'desktop' | 'mobile', position: PagePosition]; dropBlock: [type: PageBlockType, position: PagePosition] }>()
const stage = ref<HTMLElement | null>(null)
const measuredHeight = ref(0)
const guideX = ref<number | null>(null)
const draggingId = ref('')
let observer: ResizeObserver | undefined
const useFree = computed(() => props.layout === 'free' || Boolean(props.editable))
const fallback = (index: number, viewport: 'desktop' | 'mobile'): PagePosition => defaultPagePosition(props.blocks, index, viewport)
const position = (block: PageBlock, index: number, viewport: 'desktop' | 'mobile') => block.position?.[viewport] ?? fallback(index, viewport)
const stageHeight = computed(() => {
    const height = (viewport: 'desktop' | 'mobile') => Math.max(540, measuredHeight.value, ...props.blocks.map((block, index) => {
        const pos = position(block, index, viewport)
        return pos.y + (pos.height ?? (block.type === 'auth' ? 950 : block.type === 'hero' ? 320 : 220))
    }))
    return { '--desktop-height': `${height('desktop')}px`, '--mobile-height': `${height('mobile')}px` }
})
function itemStyle(block: PageBlock, index: number) {
    const desktop = position(block, index, 'desktop')
    const mobile = position(block, index, 'mobile')
    const active = props.editable && props.viewport ? position(block, index, props.viewport) : null
    return {
        '--desktop-x': `${(active ?? desktop).x}%`,
        '--desktop-y': `${(active ?? desktop).y}px`,
        '--desktop-width': `${(active ?? desktop).width}%`,
        '--desktop-height': (active ?? desktop).height ? `${(active ?? desktop).height}px` : 'auto',
        '--mobile-x': `${(active ?? mobile).x}%`,
        '--mobile-y': `${(active ?? mobile).y}px`,
        '--mobile-width': `${(active ?? mobile).width}%`,
        '--mobile-height': (active ?? mobile).height ? `${(active ?? mobile).height}px` : 'auto',
    }
}
function observeCanvas() {
    observer?.disconnect()
    if (!stage.value || typeof ResizeObserver === 'undefined') return
    const canvas = stage.value
    const items = [...canvas.querySelectorAll<HTMLElement>('.free-item')]
    const measure = () => { measuredHeight.value = Math.max(0, ...items.map((item) => item.offsetTop + item.offsetHeight + 32)) }
    observer = new ResizeObserver(measure)
    observer.observe(canvas)
    for (const item of items) observer.observe(item)
    measure()
}
watch(() => [stage.value, props.blocks, props.viewport], () => { void nextTick(observeCanvas) }, { deep: true, flush: 'post', immediate: true })
onBeforeUnmount(() => observer?.disconnect())

type DragMode = 'move' | 'e' | 'w' | 's' | 'se'
let drag: { id: string; mode: DragMode; viewport: 'desktop' | 'mobile'; startX: number; startY: number; initial: PagePosition; stageWidth: number; startHeight: number } | null = null

function snapX(x: number, width: number, altKey: boolean, ignoreId: string): number {
    if (altKey) { guideX.value = null; return x }
    const candidates = [0, 50 - width / 2, 100 - width]
    for (let i = 0; i < props.blocks.length; i++) {
        const b = props.blocks[i]!
        if (b.id === ignoreId) continue
        const p = position(b, i, props.viewport ?? 'desktop')
        candidates.push(p.x, p.x + p.width / 2 - width / 2)
    }
    for (const c of candidates) {
        if (Math.abs(x - c) <= 1.5) {
            guideX.value = Math.abs(c - (50 - width / 2)) < 0.1 ? 50 : c
            return Math.max(0, Math.min(100 - width, Math.round(c * 100) / 100))
        }
    }
    guideX.value = null
    return Math.round(x / 2.5) * 2.5
}

function startPointer(event: PointerEvent, block: PageBlock, index: number, mode: DragMode) {
    if (!stage.value || !props.editable || props.editingId === block.id) return
    const target = event.currentTarget as HTMLElement
    const viewport = props.viewport ?? (stage.value.clientWidth < 640 ? 'mobile' : 'desktop')
    const itemEl = target.closest('.free-item') as HTMLElement | null
    drag = {
        id: block.id,
        mode,
        viewport,
        startX: event.clientX,
        startY: event.clientY,
        initial: position(block, index, viewport),
        stageWidth: stage.value.getBoundingClientRect().width || stage.value.clientWidth || 1,
        startHeight: itemEl?.offsetHeight ?? 120,
    }
    target.setPointerCapture(event.pointerId)
    draggingId.value = block.id
    emit('select', block.id)
}

function movePointer(event: PointerEvent) {
    if (!drag) return
    const scale = props.zoom || 1
    const dxPct = ((event.clientX - drag.startX) / drag.stageWidth) * 100
    const dy = (event.clientY - drag.startY) / scale
    const alt = event.altKey
    if (drag.mode === 'move') {
        const rawX = Math.max(0, Math.min(100 - drag.initial.width, drag.initial.x + dxPct))
        const x = snapX(rawX, drag.initial.width, alt, drag.id)
        const rawY = Math.max(0, Math.min(5000, drag.initial.y + dy))
        const y = alt ? Math.round(rawY) : Math.round(rawY / 8) * 8
        emit('move', drag.id, drag.viewport, { ...drag.initial, x: Math.round(x * 100) / 100, y })
        return
    }
    guideX.value = null
    let { x, y, width, height } = drag.initial
    if (drag.mode === 'e' || drag.mode === 'se') {
        const w = Math.max(10, Math.min(100 - x, drag.initial.width + dxPct))
        width = Math.round((alt ? w : Math.round(w / 2.5) * 2.5) * 100) / 100
    }
    if (drag.mode === 'w') {
        const nextX = Math.max(0, Math.min(drag.initial.x + drag.initial.width - 10, drag.initial.x + dxPct))
        const snappedX = alt ? nextX : Math.round(nextX / 2.5) * 2.5
        width = Math.round((drag.initial.x + drag.initial.width - snappedX) * 100) / 100
        x = Math.round(snappedX * 100) / 100
    }
    if (drag.mode === 's' || drag.mode === 'se') {
        const h = Math.max(40, Math.min(2000, (drag.initial.height ?? drag.startHeight) + dy))
        height = alt ? Math.round(h) : Math.round(h / 8) * 8
    }
    emit('move', drag.id, drag.viewport, height === undefined ? { x, y, width } : { x, y, width, height })
}

function endPointer() {
    drag = null
    draggingId.value = ''
    guideX.value = null
}

function onDrop(event: DragEvent) {
    if (!props.editable || !stage.value) return
    const type = event.dataTransfer?.getData('application/x-flixer-block') as PageBlockType | ''
    if (!type) return
    const scale = props.zoom || 1
    const rect = stage.value.getBoundingClientRect()
    const width = props.viewport === 'mobile' ? 90 : 50
    const rawX = ((event.clientX - rect.left) / Math.max(1, rect.width)) * 100 - width / 2
    const x = Math.max(0, Math.min(100 - width, Math.round(rawX / 2.5) * 2.5))
    const y = Math.max(0, Math.min(5000, Math.round(((event.clientY - rect.top) / scale) / 8) * 8))
    emit('dropBlock', type, { x, y, width })
}
</script>

<template>
    <div class="page-canvas" :class="{ 'free-canvas': useFree }">
        <slot name="header" />
        <div v-if="useFree" ref="stage" class="free-stage" :class="{ 'show-grid': editable }" :style="stageHeight"
            @click.self="editable && emit('select', '')" @dragover.prevent @drop="onDrop">
            <div v-if="editable && guideX !== null" class="align-guide" :style="{ left: `${guideX}%` }"></div>
            <div v-for="(block, index) in blocks" :key="block.id" class="free-item"
                :class="{ 'is-editable': editable, 'is-selected': editable && selectedId === block.id, 'is-dragging': draggingId === block.id }"
                :style="itemStyle(block, index)" @click.stop="editable && emit('select', block.id)"
                @pointerdown="startPointer($event, block, index, 'move')" @pointermove="movePointer"
                @pointerup="endPointer" @pointercancel="endPointer">
                <PageBlockView :block="block" :editable="editable" :selected-id="selectedId" :editing-id="editingId"
                    @select="emit('select', $event)" @edit="emit('edit', $event)"
                    @text="(id, value) => emit('text', id, value)">
                    <template #auth>
                        <slot name="auth" />
                    </template>
                    <template #auth-field="{ block: authBlock }">
                        <slot name="auth-field" :block="authBlock" />
                    </template>
                </PageBlockView>
                <template v-if="editable && selectedId === block.id && editingId !== block.id">
                    <span class="resize-handle handle-w" @pointerdown.stop="startPointer($event, block, index, 'w')"
                        @pointermove.stop="movePointer" @pointerup.stop="endPointer"
                        @pointercancel.stop="endPointer"></span>
                    <span class="resize-handle handle-e" @pointerdown.stop="startPointer($event, block, index, 'e')"
                        @pointermove.stop="movePointer" @pointerup.stop="endPointer"
                        @pointercancel.stop="endPointer"></span>
                    <span class="resize-handle handle-s" @pointerdown.stop="startPointer($event, block, index, 's')"
                        @pointermove.stop="movePointer" @pointerup.stop="endPointer"
                        @pointercancel.stop="endPointer"></span>
                    <span class="resize-handle handle-se" @pointerdown.stop="startPointer($event, block, index, 'se')"
                        @pointermove.stop="movePointer" @pointerup.stop="endPointer"
                        @pointercancel.stop="endPointer"></span>
                </template>
            </div>
        </div>
        <template v-else>
            <PageBlockView v-for="block in blocks" :key="block.id" :block="block" :editable="editable"
                :selected-id="selectedId" :editing-id="editingId" @select="emit('select', $event)"
                @edit="emit('edit', $event)" @text="(id, value) => emit('text', id, value)">
                <template #auth>
                    <slot name="auth" />
                </template>
                <template #auth-field="{ block: authBlock }">
                    <slot name="auth-field" :block="authBlock" />
                </template>
            </PageBlockView>
        </template>
        <slot name="footer" />
    </div>
</template>

<style scoped>
.page-canvas {
    width: min(100%, 56rem);
    margin: 0 auto;
    padding: 3rem 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    container-type: inline-size;
}

.free-canvas {
    width: 100%;
    max-width: none;
    padding: 0 max(0.75rem, calc((100% - var(--content-max, 110rem)) / 2));
    box-sizing: border-box;
    gap: 0;
}

.free-stage {
    position: relative;
    min-height: var(--desktop-height);
}

.free-stage.show-grid {
    background-image: radial-gradient(color-mix(in srgb, var(--color-flixer-border) 45%, transparent) 1px, transparent 1px);
    background-size: 24px 24px;
}

.align-guide {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 1px;
    background: var(--color-flixer-accent);
    pointer-events: none;
    z-index: 4;
}

.free-item {
    position: absolute;
    left: var(--desktop-x);
    top: var(--desktop-y);
    width: var(--desktop-width);
    min-height: var(--desktop-height);
    transition: left 250ms ease, top 250ms ease, width 250ms ease;
}

.free-item.is-dragging {
    transition: none;
}

.free-item.is-editable {
    cursor: grab;
    touch-action: none;
}

.free-item.is-editable:active {
    cursor: grabbing;
}

.resize-handle {
    position: absolute;
    z-index: 5;
    background: var(--color-flixer-accent);
    border: 1px solid #fff;
    border-radius: 2px;
    touch-action: none;
}

.handle-w {
    left: -5px;
    top: 50%;
    width: 8px;
    height: 20px;
    transform: translateY(-50%);
    cursor: ew-resize;
}

.handle-e {
    right: -5px;
    top: 50%;
    width: 8px;
    height: 20px;
    transform: translateY(-50%);
    cursor: ew-resize;
}

.handle-s {
    bottom: -5px;
    left: 50%;
    width: 20px;
    height: 8px;
    transform: translateX(-50%);
    cursor: ns-resize;
}

.handle-se {
    right: -5px;
    bottom: -5px;
    width: 10px;
    height: 10px;
    cursor: nwse-resize;
}

@container (min-width: 40rem) {
    .free-canvas {
        padding-inline: max(1.5rem, calc((100% - var(--content-max, 110rem)) / 2));
    }
}

@container (max-width: 40rem) {
    .free-stage {
        min-height: var(--mobile-height);
    }

    .free-item {
        left: var(--mobile-x);
        top: var(--mobile-y);
        width: var(--mobile-width);
        min-height: var(--mobile-height);
    }
}

@media (min-width: 640px) {
    .page-canvas:not(.free-canvas) {
        padding: 4rem 2rem;
    }
}
</style>