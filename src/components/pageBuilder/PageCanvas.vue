<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { Icon } from '@iconify/vue'
import { useI18n } from 'vue-i18n'
import type { PageBlock, PagePosition } from './pageBuilder'
import PageBlockView from './PageBlockView.vue'

const props = defineProps<{ blocks: PageBlock[]; editable?: boolean; selectedId?: string; layout?: 'flow' | 'free'; viewport?: 'desktop' | 'mobile' }>()
const emit = defineEmits<{ select: [id: string]; text: [id: string, value: string]; move: [id: string, viewport: 'desktop' | 'mobile', position: PagePosition] }>()
const { t } = useI18n()
const stage = ref<HTMLElement | null>(null)
const measuredHeight = ref(0)
let observer: ResizeObserver | undefined
const fallback = (index: number): PagePosition => ({ x: 0, y: index * 200, width: 100 })
const position = (block: PageBlock, index: number, viewport: 'desktop' | 'mobile') => block.position?.[viewport] ?? fallback(index)
const stageHeight = computed(() => {
    const height = (viewport: 'desktop' | 'mobile') => Math.max(500, measuredHeight.value, ...props.blocks.map((block, index) => position(block, index, viewport).y + (block.type === 'auth' ? 950 : 400)))
    return { '--desktop-height': `${height('desktop')}px`, '--mobile-height': `${height('mobile')}px` }
})
function itemStyle(block: PageBlock, index: number) {
    const desktop = position(block, index, 'desktop')
    const mobile = position(block, index, 'mobile')
    return { '--desktop-x': `${desktop.x}%`, '--desktop-y': `${desktop.y}px`, '--desktop-width': `${desktop.width}%`, '--mobile-x': `${mobile.x}%`, '--mobile-y': `${mobile.y}px`, '--mobile-width': `${mobile.width}%` }
}
function observeCanvas() {
    observer?.disconnect()
    if (!stage.value || typeof ResizeObserver === 'undefined') return
    const canvas = stage.value
    const items = [...canvas.querySelectorAll<HTMLElement>('.free-item')]
    const measure = () => { measuredHeight.value = Math.max(0, ...items.map((item) => item.offsetTop + item.offsetHeight + 24)) }
    observer = new ResizeObserver(measure)
    observer.observe(canvas)
    for (const item of items) observer.observe(item)
    measure()
}
watch(() => [stage.value, props.blocks], () => { void nextTick(observeCanvas) }, { deep: true, flush: 'post', immediate: true })
onBeforeUnmount(() => observer?.disconnect())
let drag: { id: string; viewport: 'desktop' | 'mobile'; startX: number; startY: number; initial: PagePosition; width: number } | null = null
function startDrag(event: PointerEvent, block: PageBlock, index: number) {
    const target = event.currentTarget as HTMLElement
    if (!stage.value || !props.editable) return
    const viewport = props.viewport ?? (stage.value.clientWidth < 640 ? 'mobile' : 'desktop')
    drag = { id: block.id, viewport, startX: event.clientX, startY: event.clientY, initial: position(block, index, viewport), width: stage.value.clientWidth }
    target.setPointerCapture(event.pointerId)
    emit('select', block.id)
}
function moveDrag(event: PointerEvent) {
    if (!drag || !drag.width) return
    const x = Math.max(0, Math.min(100 - drag.initial.width, drag.initial.x + (event.clientX - drag.startX) / drag.width * 100))
    const y = Math.max(0, Math.min(5000, drag.initial.y + event.clientY - drag.startY))
    emit('move', drag.id, drag.viewport, { x: Math.round(x * 100) / 100, y: Math.round(y), width: drag.initial.width })
}
</script>

<template>
    <div class="page-canvas" :class="{ 'free-canvas': layout === 'free' }">
        <div v-if="layout === 'free'" ref="stage" class="free-stage" :style="stageHeight">
            <div v-for="(block, index) in blocks" :key="block.id" class="free-item" :style="itemStyle(block, index)">
                <button v-if="editable" type="button" class="drag-handle" :aria-label="t('pageBuilder.dragBlock')"
                    :title="t('pageBuilder.dragBlock')" @pointerdown="startDrag($event, block, index)"
                    @pointermove="moveDrag" @pointerup="drag = null" @pointercancel="drag = null">
                    <Icon icon="lucide:move" class="size-4" />
                </button>
                <PageBlockView :block="block" :editable="editable" :selected-id="selectedId"
                    @select="emit('select', $event)" @text="(id, value) => emit('text', id, value)"><template #auth>
                        <slot name="auth" />
                    </template>
                    <template #auth-field="{ block: authBlock }">
                        <slot name="auth-field" :block="authBlock" />
                    </template>
                </PageBlockView>
            </div>
        </div>
        <template v-else>
            <PageBlockView v-for="block in blocks" :key="block.id" :block="block" :editable="editable"
                :selected-id="selectedId" @select="emit('select', $event)"
                @text="(id, value) => emit('text', id, value)">
                <template #auth>
                    <slot name="auth" />
                </template>
                <template #auth-field="{ block: authBlock }">
                    <slot name="auth-field" :block="authBlock" />
                </template>
            </PageBlockView>
        </template>
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
    padding: 0;
}

.free-stage {
    position: relative;
    min-height: var(--desktop-height);
}

.free-item {
    position: absolute;
    left: var(--desktop-x);
    top: var(--desktop-y);
    width: var(--desktop-width);
}

.drag-handle {
    position: absolute;
    z-index: 3;
    right: 0;
    top: 0;
    display: grid;
    width: 2rem;
    height: 2rem;
    place-items: center;
    cursor: grab;
    touch-action: none;
    color: var(--color-flixer-text);
    background: var(--color-flixer-surface);
    border: 1px solid var(--color-flixer-border);
}

@container (max-width: 40rem) {
    .free-stage {
        min-height: var(--mobile-height);
    }

    .free-item {
        left: var(--mobile-x);
        top: var(--mobile-y);
        width: var(--mobile-width);
    }
}

@media (min-width: 640px) {
    .page-canvas:not(.free-canvas) {
        padding: 4rem 2rem;
    }
}
</style>