<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import grapesjs, { type Component, type ComponentDefinition, type Editor } from 'grapesjs'
import 'grapesjs/dist/css/grapes.min.css'
import { defaultPagePosition, type PageBlock, type PageBlockType, type PagePosition } from './pageBuilder'

const props = defineProps<{ blocks: PageBlock[]; viewport: 'desktop' | 'mobile'; selectedId: string; layout?: 'flow' | 'free' }>()
const emit = defineEmits<{ select: [id: string]; move: [id: string, viewport: 'desktop' | 'mobile', position: PagePosition]; add: [block: PageBlock] }>()
const { t } = useI18n()
const container = ref<HTMLElement | null>(null)
const palette = ref<HTMLElement | null>(null)
let editor: Editor | undefined
let loading = false
let revision = ''

function itemPosition(block: PageBlock, index: number): PagePosition {
    return block.position?.[props.viewport] ?? defaultPagePosition(props.blocks, index, props.viewport)
}
function signature() { return JSON.stringify([props.viewport, props.layout, props.blocks]) }
function node(tagName: string, value: string, style: Record<string, string> = {}): ComponentDefinition {
    return { tagName, selectable: false, hoverable: false, draggable: false, droppable: false, editable: false, style: { 'pointer-events': 'none', ...style }, components: [{ type: 'textnode', content: value }] }
}
function control(label: string): ComponentDefinition[] {
    return [node('label', label, { display: 'block', 'font-size': '14px', 'font-weight': '600', 'margin-bottom': '8px' }), node('div', '', { height: '48px', border: '1px solid #494556', 'border-radius': '4px', background: '#080811' })]
}
function preview(block: PageBlock): ComponentDefinition[] {
    const text = block.text || t(`pageBuilder.block.${block.type}`)
    if (block.type === 'heading') return [node('h2', text, { margin: '0', 'font-size': '32px', 'line-height': '1.2', 'font-weight': '700' })]
    if (block.type === 'text') return [node('p', text, { margin: '0', 'font-size': '16px', 'line-height': '1.7', 'white-space': 'pre-wrap' })]
    if (block.type === 'image' && block.image?.startsWith('data:image/')) return [{ tagName: 'img', attributes: { src: block.image, alt: block.text }, selectable: false, hoverable: false, draggable: false, style: { width: '100%', 'max-height': '512px', 'object-fit': 'contain', 'pointer-events': 'none' } }]
    if (block.type === 'button' || block.type === 'auth-action') return [node('div', text, { padding: '12px 20px', background: '#7645d7', 'border-radius': '4px', 'text-align': 'center', 'font-weight': '600' })]
    if (block.type === 'auth-custom') return control(text)
    if (block.type === 'auth-field') {
        const label = t(`pageBuilder.authField.${block.field}`)
        if (['username', 'password', 'email', 'displayName'].includes(block.field ?? '')) return control(label)
        return [node('div', label, { padding: '12px', border: '1px solid #494556', 'border-radius': '4px', 'text-align': 'center', 'font-weight': '600', background: block.field === 'submit' ? '#7645d7' : '#14131d' })]
    }
    if (block.type === 'auth') return [node('h2', t('auth.welcomeBack'), { 'font-size': '24px', 'font-weight': '700', 'margin-bottom': '20px' }), ...control(t('auth.username')), ...control(t('auth.password')), node('div', t('auth.signInToFlixer'), { padding: '12px', 'text-align': 'center', 'margin-top': '16px', 'border-radius': '4px', background: '#7645d7' })]
    if (block.type === 'card') return [node('h3', text, { 'font-size': '20px', 'font-weight': '700' }), node('p', block.description ?? '', { 'margin-top': '8px' })]
    if (block.type === 'columns') return [node('div', t('pageBuilder.block.columns'), { padding: '24px', border: '1px dashed #676271', 'text-align': 'center' })]
    return [node('div', text, { padding: '24px', border: '1px dashed #676271', 'text-align': 'center' })]
}
function render() {
    if (!editor) return
    loading = true
    const components = props.blocks.map((block, index) => {
        const position = itemPosition(block, index)
        const positioning = props.layout === 'free' ? { position: 'absolute', left: `${position.x}%`, top: `${position.y}px`, width: `${position.width}%` } : { position: 'relative', width: '100%', 'margin-bottom': '24px' }
        return {
            tagName: 'div',
            attributes: { 'data-flixer-id': block.id },
            draggable: true, droppable: false, removable: false, copyable: false, stylable: false,
            style: { ...positioning, padding: block.style?.spacing === 'spacious' ? '32px' : block.style?.spacing === 'compact' ? '4px' : '12px', 'min-height': '48px', 'text-align': block.style?.align ?? 'left', 'background-color': block.style?.background ?? 'transparent', color: block.style?.color ?? '#f4f2fb' },
            components: preview(block),
        }
    })
    editor.setComponents(components)
    revision = signature()
    loading = false
}
function changed(component: Component) {
    if (!editor || loading) return
    const id = component.getAttributes()['data-flixer-id']
    const index = props.blocks.findIndex((entry) => entry.id === id)
    if (typeof id !== 'string' || index < 0) return
    const original = itemPosition(props.blocks[index]!, index)
    const styles = component.getStyle()
    const width = editor.Canvas.getBody()?.clientWidth ?? 0
    const rawLeft = String(styles.left ?? '')
    const rawTop = Number.parseFloat(String(styles.top ?? ''))
    const left = rawLeft.endsWith('%') ? Number.parseFloat(rawLeft) : width ? Number.parseFloat(rawLeft) / width * 100 : original.x
    if (!Number.isFinite(left) || !Number.isFinite(rawTop)) return
    const position = { x: Math.round(Math.max(0, Math.min(100 - original.width, left)) * 100) / 100, y: Math.round(Math.max(0, Math.min(5000, rawTop))), width: original.width }
    if (position.x !== original.x || position.y !== original.y) {
        emit('move', id, props.viewport, position)
        revision = signature()
    }
}
function addDropped(component?: Component) {
    if (!editor || !component) return
    if (props.blocks.length >= 20) { component.remove(); return }
    const type = component.getAttributes()['data-flixer-kind'] as PageBlockType | undefined
    if (!type || !['heading', 'text', 'image', 'button', 'video', 'card', 'columns'].includes(type)) return
    const styles = component.getStyle()
    const canvasWidth = editor.Canvas.getBody()?.clientWidth ?? 0
    const left = Number.parseFloat(String(styles.left ?? '0')) || 0
    const top = Number.parseFloat(String(styles.top ?? '0')) || 0
    const x = String(styles.left ?? '').endsWith('%') ? left : canvasWidth ? left / canvasWidth * 100 : 0
    const placed = { x: Math.max(0, Math.min(50, Math.round(x * 100) / 100)), y: Math.max(0, Math.min(5000, Math.round(top))), width: 50 }
    const block: PageBlock = { id: crypto.randomUUID(), type, text: '', image: null, position: { desktop: { x: 0, y: placed.y, width: 50 }, mobile: { x: 0, y: placed.y, width: 100 } } }
    block.position![props.viewport] = placed
    if (type === 'columns') block.columns = [[], []]
    if (type === 'button' || type === 'video' || type === 'card') block.href = ''
    if (type === 'card') block.description = ''
    emit('add', block)
}
onMounted(() => {
    if (!container.value || !palette.value) return
    const types = ['heading', 'text', 'image', 'button', 'video', 'card', 'columns'] as const
    editor = grapesjs.init({ container: container.value, height: '720px', storageManager: false, panels: { defaults: [] }, noticeOnUnload: false, canvas: { styles: [] }, blockManager: { appendTo: palette.value, blocks: types.map((type) => ({ id: type, label: t(`pageBuilder.block.${type}`), content: { tagName: 'div', attributes: { 'data-flixer-kind': type }, draggable: true, droppable: false, style: { position: 'absolute', width: '50%', padding: '12px', border: '1px solid #676271', 'background-color': '#191823', color: '#f4f2fb' }, components: [{ type: 'textnode', content: t(`pageBuilder.block.${type}`) }] } })) } })
    editor.setDragMode('absolute')
    editor.on('component:selected', (component: Component) => { const id = component.getAttributes()['data-flixer-id']; if (typeof id === 'string') emit('select', id) })
    editor.on('component:drag:end', ({ target }) => { if (target) changed(target) })
    editor.on('block:drag:stop', (component) => addDropped(component))
    render()
})
watch(() => signature(), (next) => { if (next !== revision) render() })
onBeforeUnmount(() => { editor?.destroy(); editor = undefined })
</script>

<template>
    <div>
        <div ref="palette" class="grapes-palette"></div>
        <div ref="container" class="grapes-canvas" :aria-label="t('pageBuilder.preview')"></div>
    </div>
</template>

<style scoped>
.grapes-canvas {
    min-height: 720px;
}

.grapes-canvas :deep(.gjs-one-bg) {
    background: var(--color-flixer-surface);
}

.grapes-canvas :deep(.gjs-cv-canvas) {
    width: 100%;
    height: 100%;
    top: 0;
}

.grapes-palette :deep(.gjs-blocks-c) {
    display: flex;
    flex-wrap: wrap;
    gap: .5rem;
    padding: .5rem;
    background: var(--color-flixer-surface);
}

.grapes-palette :deep(.gjs-block) {
    width: auto;
    min-height: 2rem;
    margin: 0;
    padding: .4rem .7rem;
    border: 1px solid var(--color-flixer-border);
    border-radius: 4px;
    background: var(--color-flixer-background);
    color: var(--color-flixer-text);
    font-size: .75rem;
}
</style>