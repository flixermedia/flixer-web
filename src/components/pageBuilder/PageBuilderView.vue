<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { Button } from '@ui-sdk/vue/button'
import { Input } from '@ui-sdk/vue/input'
import { Textarea } from '@ui-sdk/vue/textarea'
import { cancelBuilderSchedule, createBuilderPage, createPageTemplate, defaultPagePosition, deleteBuilderPage, deletePageTemplate, getPageSiteSettings, listBuilderPages, listPageTemplates, publishBuilderPage, restoreBuilderVersion, saveBuilderPage, savePageSiteSettings, scheduleBuilderPage, unpublishBuilderPage, type AuthField, type BuilderPage, type MediaRowSource, type PageBlock, type PageBlockStyle, type PageBlockType, type PagePosition, type PageSiteSettings, type ReusablePageBlock } from './pageBuilder'
import { saveAppearanceSettings } from '../../api/appearance'
import { refreshAppearance } from '../../composables/useAppearance'
import { getMobileTabs, getNavLinks } from '../../composables/homeNav'
import { confirmAction } from '../../composables/confirm'
import { notify } from '../../composables/notify'
import { describeRequestError } from '../../composables/useProfile'
import Header from '../header/Header.vue'
import MobileTabBar from '../home/MobileTabBar.vue'
import BlockTree from './BlockTree.vue'
import PageCanvas from './PageCanvas.vue'
import { refreshPageNavigation } from './usePageNavigation'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const pages = ref<BuilderPage[]>([])
const templates = ref<ReusablePageBlock[]>([])
const templateName = ref('')
const selectedTemplate = ref('')
const site = ref<PageSiteSettings>({ homePageId: null, navigationIds: [] })
const page = ref<BuilderPage | null>(null)
const selectedBlock = ref('')
const editingBlock = ref('')
const saved = ref('')
const busy = ref(false)
const loading = ref(true)
const preview = ref<'desktop' | 'mobile'>('desktop')
const publishAt = ref('')
const textEditor = ref<HTMLTextAreaElement | null>(null)
const undoStack = ref<string[]>([])
const redoStack = ref<string[]>([])
let applyingHistory = false

const leftWidth = ref(Number(localStorage.getItem('flixer.pageBuilder.leftWidth')) || 256)
const rightWidth = ref(Number(localStorage.getItem('flixer.pageBuilder.rightWidth')) || 320)
const zoom = ref(1)
const panX = ref(0)
const panY = ref(0)
const panKey = ref(false)
const panning = ref(false)
let paneDrag: { side: 'left' | 'right'; startX: number; initial: number } | null = null
let panDrag: { startX: number; startY: number; initialX: number; initialY: number } | null = null

function startPaneResize(side: 'left' | 'right', event: PointerEvent) {
    const target = event.currentTarget as HTMLElement
    paneDrag = { side, startX: event.clientX, initial: side === 'left' ? leftWidth.value : rightWidth.value }
    target.setPointerCapture(event.pointerId)
}
function movePaneResize(event: PointerEvent) {
    if (!paneDrag) return
    const dx = event.clientX - paneDrag.startX
    if (paneDrag.side === 'left') {
        leftWidth.value = Math.max(200, Math.min(440, paneDrag.initial + dx))
        localStorage.setItem('flixer.pageBuilder.leftWidth', String(leftWidth.value))
    } else {
        rightWidth.value = Math.max(240, Math.min(480, paneDrag.initial - dx))
        localStorage.setItem('flixer.pageBuilder.rightWidth', String(rightWidth.value))
    }
}
function setZoom(next: number) {
    zoom.value = Math.round(Math.max(0.25, Math.min(2, next)) * 100) / 100
}
function resetView() {
    zoom.value = 1
    panX.value = 0
    panY.value = 0
}
function onPreviewWheel(event: WheelEvent) {
    event.preventDefault()
    if (event.ctrlKey || event.metaKey) {
        setZoom(zoom.value + (event.deltaY < 0 ? 0.1 : -0.1))
        return
    }
    panX.value = Math.round(panX.value - event.deltaX)
    panY.value = Math.round(panY.value - event.deltaY)
}
function startPan(event: PointerEvent) {
    if (!panKey.value && event.button !== 1) return
    event.preventDefault()
    event.stopPropagation()
    const target = event.currentTarget as HTMLElement
    panning.value = true
    panDrag = { startX: event.clientX, startY: event.clientY, initialX: panX.value, initialY: panY.value }
    target.setPointerCapture(event.pointerId)
}
function movePan(event: PointerEvent) {
    if (!panDrag) return
    panX.value = Math.round(panDrag.initialX + event.clientX - panDrag.startX)
    panY.value = Math.round(panDrag.initialY + event.clientY - panDrag.startY)
}
function endPan() {
    panDrag = null
    panning.value = false
}

const PALETTE_BLOCKS: { type: Exclude<PageBlockType, 'auth' | 'auth-field' | 'auth-custom' | 'auth-action'>; label: string; icon: string }[] = [
    { type: 'heading', label: 'Heading', icon: 'lucide:heading' },
    { type: 'text', label: 'Text', icon: 'lucide:type' },
    { type: 'hero', label: 'Hero', icon: 'lucide:sparkles' },
    { type: 'media-row', label: 'Media row', icon: 'lucide:film' },
    { type: 'image', label: 'Image', icon: 'lucide:image' },
    { type: 'button', label: 'Button', icon: 'lucide:mouse-pointer-click' },
    { type: 'video', label: 'Video', icon: 'lucide:video' },
    { type: 'card', label: 'Card', icon: 'lucide:square-stack' },
    { type: 'columns', label: 'Columns', icon: 'lucide:columns-2' },
]

function findBlock(blocks: PageBlock[], id: string): PageBlock | undefined {
    for (const block of blocks) {
        if (block.id === id) return block
        for (const column of block.columns ?? []) { const found = findBlock(column, id); if (found) return found }
    }
}
const activeBlock = computed(() => findBlock(page.value?.draft.blocks ?? [], selectedBlock.value))
const missingAuthFields = computed(() => (['displayName', 'passkey', 'quickConnect', 'providers', 'resend'] as AuthField[]).filter((field) => !page.value?.draft.blocks.some((block) => block.type === 'auth-field' && block.field === field)))
const fingerprint = (value: BuilderPage) => JSON.stringify({ title: value.title, slug: value.slug, access: value.access ?? 'public', clusterId: value.clusterId ?? null, draft: value.draft })
const dirty = computed(() => page.value !== null && fingerprint(page.value) !== saved.value)
const routeSlug = computed(() => typeof route.params.slug === 'string' && route.params.slug.trim() ? route.params.slug.trim().toLowerCase() : '')
const missingSlug = ref(false)
const clusterRootId = computed(() => {
    if (!routeSlug.value || !page.value || page.value.kind !== 'page') return null
    return page.value.clusterId ?? page.value.id
})
const visiblePages = computed(() => {
    if (!routeSlug.value) return pages.value
    if (!page.value) return []
    if (page.value.kind === 'login') return [page.value]
    const rootId = clusterRootId.value
    return pages.value.filter((entry) => entry.kind === 'page' && (entry.id === rootId || entry.clusterId === rootId))
})
const field = 'mt-1 w-full rounded border border-flixer-border bg-flixer-background px-3 py-2 text-sm text-flixer-text outline-none focus:border-flixer-accent'
const tool = 'grid size-9 place-items-center rounded text-flixer-muted hover:bg-white/10 hover:text-flixer-text focus-visible:outline-2 focus-visible:outline-flixer-accent disabled:opacity-30'

function openPage(value: BuilderPage) {
    applyingHistory = true
    const copy = JSON.parse(JSON.stringify(value)) as BuilderPage
    copy.draft.layout = 'free'
    for (const [index, block] of copy.draft.blocks.entries()) {
        block.position ??= { desktop: defaultPagePosition(copy.draft.blocks, index, 'desktop'), mobile: defaultPagePosition(copy.draft.blocks, index, 'mobile') }
    }
    page.value = copy
    saved.value = fingerprint(copy)
    selectedBlock.value = copy.draft.blocks[0]?.id ?? ''
    editingBlock.value = ''
    undoStack.value = [JSON.stringify(copy.draft)]
    redoStack.value = []
    void nextTick(() => { applyingHistory = false })
}

watch(() => page.value?.draft, (draft) => {
    if (!draft || applyingHistory) return
    const snap = JSON.stringify(draft)
    if (undoStack.value[undoStack.value.length - 1] === snap) return
    undoStack.value.push(snap)
    if (undoStack.value.length > 50) undoStack.value.shift()
    redoStack.value = []
}, { deep: true })

function undo() {
    if (!page.value || undoStack.value.length <= 1) return
    const current = undoStack.value.pop()!
    redoStack.value.push(current)
    applyingHistory = true
    page.value.draft = JSON.parse(undoStack.value[undoStack.value.length - 1]!)
    void nextTick(() => { applyingHistory = false })
}

function redo() {
    if (!page.value || redoStack.value.length === 0) return
    const next = redoStack.value.pop()!
    undoStack.value.push(next)
    applyingHistory = true
    page.value.draft = JSON.parse(next)
    void nextTick(() => { applyingHistory = false })
}

function updatePage(value: BuilderPage) {
    const index = pages.value.findIndex((entry) => entry.id === value.id)
    if (index < 0) pages.value.push(value)
    else pages.value[index] = value
    openPage(value)
}
async function mayLeave() { return !dirty.value || await confirmAction(t('pageBuilder.discard')) }
onBeforeRouteLeave(async () => mayLeave())

function onKeydown(event: KeyboardEvent) {
    if (event.key === 'Meta' || event.key === ' ') {
        const tEl = event.target as HTMLElement | null
        const inField = tEl?.tagName === 'INPUT' || tEl?.tagName === 'TEXTAREA' || tEl?.tagName === 'SELECT' || tEl?.isContentEditable
        if (event.key === 'Meta' || !inField) {
            panKey.value = true
            if (event.key === ' ') event.preventDefault()
        }
    }
    if ((event.metaKey || event.ctrlKey) && (event.key === '=' || event.key === '+')) {
        event.preventDefault()
        setZoom(zoom.value + 0.1)
        return
    }
    if ((event.metaKey || event.ctrlKey) && event.key === '-') {
        event.preventDefault()
        setZoom(zoom.value - 0.1)
        return
    }
    if ((event.metaKey || event.ctrlKey) && event.key === '0') {
        event.preventDefault()
        resetView()
        return
    }
    const target = event.target as HTMLElement | null
    const inInput = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.tagName === 'SELECT' || target?.isContentEditable
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') {
        if (inInput) return
        event.preventDefault()
        if (event.shiftKey) redo()
        else undo()
        return
    }
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'y' && !inInput) {
        event.preventDefault()
        redo()
        return
    }
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'd' && activeBlock.value && !inInput) {
        event.preventDefault()
        duplicateBlock(activeBlock.value.id)
        return
    }
    if (event.key === 'Escape') {
        if (editingBlock.value) editingBlock.value = ''
        else selectedBlock.value = ''
        return
    }
    if ((event.key === 'Delete' || event.key === 'Backspace') && activeBlock.value && !inInput && !editingBlock.value) {
        event.preventDefault()
        removeBlock(activeBlock.value.id)
    }
}

function syncRoutePage() {
    if (routeSlug.value) {
        const target = pages.value.find((entry) => entry.slug.toLowerCase() === routeSlug.value || entry.id.toLowerCase() === routeSlug.value)
        if (!target) {
            page.value = null
            missingSlug.value = true
            return
        }
        missingSlug.value = false
        if (page.value?.id !== target.id) openPage(target)
        return
    }
    missingSlug.value = false
    const initial = pages.value.find((entry) => entry.id === route.query.page) ?? pages.value[0]
    if (initial && (!page.value || !pages.value.some((entry) => entry.id === page.value?.id))) openPage(initial)
}

watch(routeSlug, () => {
    if (!loading.value) syncRoutePage()
})

function onBeforeUnload(event: BeforeUnloadEvent) {
    if (!dirty.value) return
    event.preventDefault()
    event.returnValue = ''
}

function onKeyup(event: KeyboardEvent) {
    if (event.key === 'Meta' || event.key === ' ') panKey.value = false
}

onMounted(async () => {
    window.addEventListener('keydown', onKeydown)
    window.addEventListener('keyup', onKeyup)
    window.addEventListener('beforeunload', onBeforeUnload)
    try {
        const [loadedPages, loadedSite, loadedTemplates] = await Promise.all([listBuilderPages(), getPageSiteSettings(), listPageTemplates()])
        pages.value = loadedPages
        site.value = loadedSite
        templates.value = loadedTemplates
        syncRoutePage()
    } catch (error) { notify.error(describeRequestError(error, t('pageBuilder.loadError'))) }
    finally { loading.value = false }
})
onBeforeUnmount(() => {
    window.removeEventListener('keydown', onKeydown)
    window.removeEventListener('keyup', onKeyup)
    window.removeEventListener('beforeunload', onBeforeUnload)
})

async function selectPage(value: BuilderPage) {
    if (page.value?.id === value.id) return
    if (!(await mayLeave())) return
    if (routeSlug.value) {
        openPage(value)
        await router.push({ name: 'page-builder', params: { slug: value.slug } })
        return
    }
    openPage(value)
}
async function createPage() {
    if (busy.value || !(await mayLeave())) return
    busy.value = true
    try {
        const created = await createBuilderPage(clusterRootId.value ?? undefined)
        updatePage(created)
        if (routeSlug.value) {
            await router.push({ name: 'page-builder', params: { slug: created.slug } })
        }
    }
    catch (error) { notify.error(describeRequestError(error, t('pageBuilder.saveError'))) }
    finally { busy.value = false }
}
async function saveDraft(): Promise<BuilderPage | null> {
    if (!page.value) return null
    const result = await saveBuilderPage(page.value)
    updatePage(result)
    if (routeSlug.value && routeSlug.value !== result.slug.toLowerCase()) {
        await router.replace({ name: 'page-builder', params: { slug: result.slug } })
    }
    return result
}
async function save() {
    if (busy.value || !page.value) return
    busy.value = true
    try { await saveDraft(); notify.success(t('pageBuilder.saved')) }
    catch (error) { notify.error(describeRequestError(error, t('pageBuilder.saveError'))) }
    finally { busy.value = false }
}
async function publish() {
    if (busy.value || !page.value) return
    busy.value = true
    try {
        const draft = await saveDraft()
        if (!draft) return
        const published = await publishBuilderPage(draft.id)
        updatePage(published)
        await refreshPageNavigation()
        if (published.kind === 'login') { await saveAppearanceSettings({ loginLayout: 'custom' }); await refreshAppearance() }
        notify.success(t('pageBuilder.published'))
    } catch (error) { notify.error(describeRequestError(error, t('pageBuilder.publishError'))) }
    finally { busy.value = false }
}
async function unpublish() {
    if (!page.value || busy.value || !(await confirmAction(t('pageBuilder.unpublishConfirm')))) return
    busy.value = true
    try {
        const result = await unpublishBuilderPage(page.value.id)
        const index = pages.value.findIndex((entry) => entry.id === result.id)
        if (index >= 0) pages.value[index] = result
        if (page.value?.id === result.id) page.value.published = result.published
        if (result.kind === 'login') await refreshAppearance()
        else await refreshPageNavigation()
        notify.success(t('pageBuilder.unpublished'))
    }
    catch (error) { notify.error(describeRequestError(error, t('pageBuilder.saveError'))) }
    finally { busy.value = false }
}
async function setSiteOption(key: 'home' | 'navigation', enabled: boolean) {
    if (!page.value?.published || page.value.kind !== 'page' || busy.value) return
    const available = new Set(pages.value.filter((entry) => entry.kind === 'page' && entry.published).map((entry) => entry.id))
    const navigationIds = site.value.navigationIds.filter((id) => available.has(id))
    let homePageId = site.value.homePageId && available.has(site.value.homePageId) ? site.value.homePageId : null
    if (key === 'home') homePageId = enabled ? page.value.id : (homePageId === page.value.id ? null : homePageId)
    else if (enabled && !navigationIds.includes(page.value.id)) navigationIds.push(page.value.id)
    else if (!enabled) navigationIds.splice(navigationIds.indexOf(page.value.id), navigationIds.includes(page.value.id) ? 1 : 0)
    busy.value = true
    try { site.value = await savePageSiteSettings({ homePageId, navigationIds }); await refreshPageNavigation() }
    catch (error) { notify.error(describeRequestError(error, t('pageBuilder.saveError'))) }
    finally { busy.value = false }
}
async function schedule() {
    if (busy.value || !page.value || !publishAt.value) return
    busy.value = true
    try {
        const draft = await saveDraft()
        if (!draft) return
        const timestamp = new Date(publishAt.value)
        if (Number.isNaN(timestamp.getTime())) throw new Error(t('pageBuilder.scheduleError'))
        updatePage(await scheduleBuilderPage(draft.id, timestamp.toISOString()))
        notify.success(t('pageBuilder.scheduled'))
    } catch (error) { notify.error(describeRequestError(error, t('pageBuilder.scheduleError'))) }
    finally { busy.value = false }
}
async function cancelSchedule() {
    if (!page.value || busy.value) return
    busy.value = true
    try {
        const result = await cancelBuilderSchedule(page.value.id)
        const index = pages.value.findIndex((entry) => entry.id === result.id)
        if (index >= 0) pages.value[index] = result
        if (page.value?.id === result.id) page.value.scheduled = null
    } catch (error) { notify.error(describeRequestError(error, t('pageBuilder.saveError'))) }
    finally { busy.value = false }
}
async function restore(versionId: string) {
    if (!page.value || busy.value || !(await mayLeave())) return
    busy.value = true
    try { updatePage(await restoreBuilderVersion(page.value.id, versionId)); notify.success(t('pageBuilder.restored')) }
    catch (error) { notify.error(describeRequestError(error, t('pageBuilder.saveError'))) }
    finally { busy.value = false }
}
async function removePage() {
    if (!page.value || page.value.kind === 'login' || busy.value || !(await confirmAction(t('pageBuilder.deleteConfirm'), { danger: true }))) return
    busy.value = true
    try {
        const id = page.value.id
        await deleteBuilderPage(id)
        pages.value = pages.value.filter((entry) => entry.id !== id)
        if (routeSlug.value) {
            const next = visiblePages.value[0]
            if (next) {
                openPage(next)
                await router.replace({ name: 'page-builder', params: { slug: next.slug } })
            } else {
                page.value = null
                await router.push({ name: 'page-builder' })
            }
            return
        }
        const first = pages.value[0]
        if (first) openPage(first)
    } catch (error) { notify.error(describeRequestError(error, t('pageBuilder.saveError'))) }
    finally { busy.value = false }
}
function buildBlock(type: Exclude<PageBlockType, 'auth'>, droppedPos?: PagePosition): PageBlock {
    const index = page.value?.draft.blocks.length ?? 0
    const blocks = page.value?.draft.blocks ?? []
    const desktop = droppedPos && preview.value === 'desktop' ? droppedPos : defaultPagePosition(blocks, index, 'desktop')
    const mobile = droppedPos && preview.value === 'mobile' ? droppedPos : defaultPagePosition(blocks, index, 'mobile')
    if (type === 'hero' || type === 'media-row') desktop.width = droppedPos ? desktop.width : 100
    const block: PageBlock = { id: crypto.randomUUID(), type, text: '', image: null, position: { desktop, mobile } }
    if (type === 'columns') block.columns = [[], []]
    if (type === 'button' || type === 'card' || type === 'video' || type === 'hero') block.href = ''
    if (type === 'card' || type === 'hero') block.description = ''
    if (type === 'hero') block.buttonText = 'Watch now'
    if (type === 'media-row') block.source = 'recent'
    if (type === 'auth-custom') block.text = t('pageBuilder.customField')
    if (type === 'auth-action') { block.text = t('pageBuilder.customAction'); block.href = ''; block.allowedFields = [] }
    return block
}
function addBlock(type: Exclude<PageBlockType, 'auth'>, droppedPos?: PagePosition) {
    if (!page.value || page.value.draft.blocks.length >= 20) return
    const block = buildBlock(type, droppedPos)
    page.value.draft.layout = 'free'
    page.value.draft.blocks.push(block)
    selectedBlock.value = block.id
    editingBlock.value = ''
}
function createCustomForm() {
    if (!page.value || page.value.kind !== 'login') return
    const blocks = page.value.draft.blocks
    const index = blocks.findIndex((block) => block.type === 'auth')
    if (index < 0 || blocks.length + 9 > 20) return
    const fields: AuthField[] = ['username', 'password', 'email', 'displayName', 'submit', 'switch', 'passkey', 'quickConnect', 'providers', 'resend']
    const startY = Math.min(4200, blocks[index]?.position?.desktop.y ?? index * 180)
    const mobileY = Math.min(4200, blocks[index]?.position?.mobile.y ?? index * 180)
    const elements: PageBlock[] = fields.map((field, fieldIndex) => ({ id: crypto.randomUUID(), type: 'auth-field', field, text: '', image: null, position: { desktop: { x: 25, y: startY + fieldIndex * 85, width: 50 }, mobile: { x: 5, y: mobileY + fieldIndex * 85, width: 90 } } }))
    blocks.splice(index, 1, ...elements)
    page.value.draft.layout = 'free'
    selectedBlock.value = elements[0]!.id
}
function addAuthField(field: AuthField) {
    if (!page.value || page.value.draft.blocks.length >= 20 || page.value.draft.blocks.some((block) => block.type === 'auth-field' && block.field === field)) return
    const index = page.value.draft.blocks.length
    const block: PageBlock = { id: crypto.randomUUID(), type: 'auth-field', field, text: '', image: null, position: { desktop: defaultPagePosition(page.value.draft.blocks, index, 'desktop'), mobile: defaultPagePosition(page.value.draft.blocks, index, 'mobile') } }
    page.value.draft.blocks.push(block)
    selectedBlock.value = block.id
}
function moveOnCanvas(id: string, viewport: 'desktop' | 'mobile', position: PagePosition) {
    const block = findBlock(page.value?.draft.blocks ?? [], id)
    if (!block) return
    block.position ??= { desktop: { x: 0, y: 0, width: 100 }, mobile: { x: 0, y: 0, width: 100 } }
    block.position[viewport] = position
}
function findParent(blocks: PageBlock[], id: string): PageBlock[] | undefined {
    if (blocks.some((block) => block.id === id)) return blocks
    for (const block of blocks) for (const column of block.columns ?? []) { const found = findParent(column, id); if (found) return found }
}
function removeBlock(id: string) {
    const blocks = findParent(page.value?.draft.blocks ?? [], id)
    const index = blocks?.findIndex((block) => block.id === id) ?? -1
    if (!blocks || index < 0 || blocks[index]?.type === 'auth') return
    if (blocks[index]?.type === 'auth-custom') for (const action of page.value?.draft.blocks ?? []) if (action.type === 'auth-action') action.allowedFields = action.allowedFields?.filter((field) => field !== id)
    blocks.splice(index, 1)
    selectedBlock.value = blocks[Math.min(index, blocks.length - 1)]?.id ?? ''
    editingBlock.value = ''
}
function duplicateBlock(id: string) {
    const blocks = findParent(page.value?.draft.blocks ?? [], id)
    const index = blocks?.findIndex((block) => block.id === id) ?? -1
    if (!blocks || index < 0 || blocks[index]?.type === 'auth') return
    const copy = JSON.parse(JSON.stringify(blocks[index])) as PageBlock
    const assignIds = (block: PageBlock) => { block.id = crypto.randomUUID(); block.columns?.flat().forEach(assignIds) }
    assignIds(copy)
    if (copy.position) {
        copy.position.desktop.y = Math.min(5000, copy.position.desktop.y + 32)
        copy.position.mobile.y = Math.min(5000, copy.position.mobile.y + 32)
    }
    blocks.splice(index + 1, 0, copy)
    selectedBlock.value = copy.id
}
async function saveTemplate() {
    if (!activeBlock.value || busy.value || !templateName.value.trim()) return
    busy.value = true
    try { templates.value.push(await createPageTemplate(templateName.value.trim(), activeBlock.value)); templateName.value = '' }
    catch (error) { notify.error(describeRequestError(error, t('pageBuilder.saveError'))) }
    finally { busy.value = false }
}
function insertTemplate() {
    const template = templates.value.find((entry) => entry.id === selectedTemplate.value)
    if (!page.value || !template || page.value.draft.blocks.length >= 20) return
    const copy = JSON.parse(JSON.stringify(template.block)) as PageBlock
    const assignIds = (block: PageBlock) => { block.id = crypto.randomUUID(); block.columns?.flat().forEach(assignIds) }
    assignIds(copy)
    const index = page.value.draft.blocks.length
    copy.position = { desktop: defaultPagePosition(page.value.draft.blocks, index, 'desktop'), mobile: defaultPagePosition(page.value.draft.blocks, index, 'mobile') }
    page.value.draft.blocks.push(copy)
    selectedBlock.value = copy.id
}
async function removeTemplate() {
    if (!selectedTemplate.value || busy.value || !(await confirmAction(t('pageBuilder.deleteTemplateConfirm'), { danger: true }))) return
    busy.value = true
    try { await deletePageTemplate(selectedTemplate.value); templates.value = templates.value.filter((entry) => entry.id !== selectedTemplate.value); selectedTemplate.value = '' }
    catch (error) { notify.error(describeRequestError(error, t('pageBuilder.saveError'))) }
    finally { busy.value = false }
}
function setStyle<K extends keyof PageBlockStyle>(key: K, value?: PageBlockStyle[K]) {
    if (!activeBlock.value) return
    const style: PageBlockStyle = { ...(activeBlock.value.style ?? {}) }
    if (value === undefined) delete style[key]
    else style[key] = value
    activeBlock.value.style = style
}
function formatText(before: string, after = '') {
    const input = textEditor.value
    const block = activeBlock.value
    if (!input || !block || block.type !== 'text') return
    const start = input.selectionStart
    const end = input.selectionEnd
    const content = block.text.slice(start, end) || t('pageBuilder.text')
    block.text = `${block.text.slice(0, start)}${before}${content}${after}${block.text.slice(end)}`.slice(0, 4000)
    void nextTick(() => { input.focus(); input.setSelectionRange(start + before.length, start + before.length + content.length) })
}
async function readImage(event: Event) {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    input.value = ''
    if (!file || !activeBlock.value) return
    if (file.size > 256 * 1024 || !['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) { notify.error(t('pageBuilder.imageError')); return }
    const target = activeBlock.value
    try {
        target.image = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(String(reader.result))
            reader.onerror = () => reject(reader.error)
            reader.readAsDataURL(file)
        })
    } catch { notify.error(t('pageBuilder.imageError')) }
}
</script>

<template>
    <main class="flex h-dvh flex-col overflow-hidden bg-flixer-background text-flixer-text">
        <header class="flex shrink-0 flex-wrap items-center gap-3 border-b border-flixer-border px-4 py-3 sm:px-6">
            <Button type="button" :class="tool" :aria-label="t('pageBuilder.back')" :title="t('pageBuilder.back')"
                data-agent-hidden
                @click="router.push({ name: 'admin', query: { tab: 'settings', page: 'appearance' } })">
                <Icon icon="lucide:arrow-left" class="size-5" />
            </Button>
            <div class="min-w-0 flex-1">
                <h1 class="text-lg font-semibold">{{ t('pageBuilder.title') }}</h1>
                <p v-if="page" class="truncate text-xs text-flixer-muted">{{ page.title }}<span v-if="dirty"> · {{
                    t('pageBuilder.unsaved') }}</span></p>
            </div>
            <div class="flex items-center gap-1" data-agent-hidden>
                <Button type="button" :class="tool" :disabled="undoStack.length <= 1" title="Undo (Ctrl+Z)"
                    aria-label="Undo" @click="undo">
                    <Icon icon="lucide:undo-2" class="size-4" />
                </Button>
                <Button type="button" :class="tool" :disabled="redoStack.length === 0" title="Redo (Ctrl+Shift+Z)"
                    aria-label="Redo" @click="redo">
                    <Icon icon="lucide:redo-2" class="size-4" />
                </Button>
            </div>
            <div class="flex items-center rounded border border-flixer-border" data-agent-hidden>
                <Button type="button" :class="tool" :disabled="zoom <= 0.25" title="Zoom out (Ctrl/Cmd -)"
                    aria-label="Zoom out" @click="setZoom(zoom - 0.1)">
                    <Icon icon="lucide:zoom-out" class="size-4" />
                </Button>
                <Button type="button" class="px-2 text-xs font-medium text-flixer-muted hover:text-flixer-text"
                    title="Reset zoom & pan (Ctrl/Cmd 0)" @click="resetView">{{ Math.round(zoom * 100) }}%</Button>
                <Button type="button" :class="tool" :disabled="zoom >= 2" title="Zoom in (Ctrl/Cmd +)"
                    aria-label="Zoom in" @click="setZoom(zoom + 0.1)">
                    <Icon icon="lucide:zoom-in" class="size-4" />
                </Button>
            </div>
            <div class="flex rounded border border-flixer-border" data-agent-hidden>
                <Button v-for="mode in ['desktop', 'mobile'] as const" :key="mode" type="button" :class="tool"
                    :aria-pressed="preview === mode" :title="t(`pageBuilder.${mode}`)"
                    :aria-label="t(`pageBuilder.${mode}`)" @click="preview = mode">
                    <Icon :icon="mode === 'desktop' ? 'lucide:monitor' : 'lucide:smartphone'" class="size-4" />
                </Button>
            </div>
            <Button type="button" :disabled="busy || !page" data-agent-hidden
                class="rounded border border-flixer-border px-3 py-2 text-sm font-semibold hover:bg-white/5 disabled:opacity-40"
                @click="save">{{ t('pageBuilder.save') }}</Button>
            <Button type="button" :disabled="busy || !page" data-agent-hidden
                class="rounded bg-flixer-primary px-3 py-2 text-sm font-semibold text-white hover:bg-flixer-secondary disabled:opacity-40"
                @click="publish">{{ page?.kind === 'login' ? t('pageBuilder.publishLogin') : t('pageBuilder.publish')
                }}</Button>
        </header>
        <p v-if="loading" role="status" class="p-6 text-flixer-muted">{{ t('pageBuilder.loading') }}</p>
        <div v-else-if="missingSlug" class="p-8">
            <p class="text-sm text-flixer-muted">{{ t('pageBuilder.notFound') }}</p>
            <RouterLink :to="{ name: 'page-builder' }"
                class="mt-3 inline-block rounded border border-flixer-border px-3 py-1.5 text-xs font-medium hover:border-flixer-accent">
                All pages
            </RouterLink>
        </div>
        <div v-else-if="page" class="builder-workspace min-h-0 flex-1 overflow-hidden"
            :style="{ '--left-width': `${leftWidth}px`, '--right-width': `${rightWidth}px` }">
            <!-- Left Panel: Pages, Palette, Templates, Layers -->
            <aside class="builder-left h-full overflow-y-auto border-flixer-border p-4" :inert="busy" :aria-busy="busy" data-agent-hidden>
                <div class="flex items-center justify-between gap-2">
                    <h2 class="text-sm font-semibold">{{ t('pageBuilder.pages') }}</h2>
                    <Button v-if="!routeSlug || page.kind === 'page'" type="button" :class="tool" :disabled="busy"
                        :title="t('pageBuilder.addPage')" :aria-label="t('pageBuilder.addPage')" @click="createPage">
                        <Icon icon="lucide:plus" class="size-4" />
                    </Button>
                </div>
                <div class="mt-2 grid gap-1">
                    <Button v-for="entry in visiblePages" :key="entry.id" type="button"
                        class="truncate rounded px-3 py-2 text-left text-sm hover:bg-white/5"
                        :class="entry.id === page.id ? 'bg-flixer-primary/20 text-flixer-text' : 'text-flixer-muted'"
                        @click="selectPage(entry)">{{ entry.title }}</Button>
                </div>

                <div class="my-4 border-t border-flixer-border"></div>
                <div class="flex items-center justify-between">
                    <h2 class="text-sm font-semibold">{{ t('pageBuilder.blocks') }}</h2>
                    <span class="text-xs text-flixer-muted">{{ page.draft.blocks.length }}/20</span>
                </div>
                <div class="mt-2 grid grid-cols-2 gap-1.5">
                    <button v-for="item in PALETTE_BLOCKS" :key="item.type" type="button" draggable="true"
                        :disabled="page.draft.blocks.length >= 20"
                        class="flex items-center gap-1.5 rounded border border-flixer-border bg-flixer-background px-2 py-1.5 text-left text-xs hover:border-flixer-accent disabled:opacity-40"
                        @dragstart="$event.dataTransfer?.setData('application/x-flixer-block', item.type)"
                        @click="addBlock(item.type)">
                        <Icon :icon="item.icon" class="size-3.5 shrink-0 text-flixer-accent" />
                        <span class="truncate">{{ item.label }}</span>
                    </button>
                </div>

                <template v-if="page.kind === 'login'">
                    <div class="mt-2 flex flex-wrap gap-1.5">
                        <Button v-if="page.draft.blocks.some((b) => b.type === 'auth')" type="button"
                            class="w-full rounded border border-flixer-accent px-2 py-1.5 text-xs text-flixer-accent hover:bg-flixer-accent/10"
                            @click="createCustomForm">{{ t('pageBuilder.createCustomForm') }}</Button>
                        <template v-else>
                            <Button v-for="authField in missingAuthFields" :key="authField" type="button"
                                class="rounded border border-flixer-border px-2 py-1 text-xs hover:bg-white/5"
                                @click="addAuthField(authField)">+ {{ t(`pageBuilder.authField.${authField}`) }}</Button>
                            <Button type="button" class="rounded border border-flixer-border px-2 py-1 text-xs hover:bg-white/5"
                                @click="addBlock('auth-custom')">+ {{ t('pageBuilder.customField') }}</Button>
                            <Button type="button" class="rounded border border-flixer-border px-2 py-1 text-xs hover:bg-white/5"
                                @click="addBlock('auth-action')">+ {{ t('pageBuilder.customAction') }}</Button>
                        </template>
                    </div>
                </template>

                <div class="my-4 border-t border-flixer-border"></div>
                <h2 class="text-sm font-semibold">{{ t('pageBuilder.reusableBlocks') }}</h2>
                <div v-if="templates.length" class="mt-2 flex gap-1">
                    <select v-model="selectedTemplate" class="mt-0 flex-1" :class="field">
                        <option value="">{{ t('pageBuilder.chooseTemplate') }}</option>
                        <option v-for="tpl in templates" :key="tpl.id" :value="tpl.id">{{ tpl.name }}</option>
                    </select>
                    <Button type="button" :class="tool" :disabled="!selectedTemplate" @click="insertTemplate">
                        <Icon icon="lucide:plus" class="size-4" />
                    </Button>
                    <Button type="button" :class="tool" :disabled="!selectedTemplate" @click="removeTemplate">
                        <Icon icon="lucide:trash-2" class="size-4" />
                    </Button>
                </div>
                <div v-if="activeBlock" class="mt-2 flex gap-1">
                    <Input v-model:value="templateName" :placeholder="t('pageBuilder.templateName')" class="mt-0 flex-1" :class="field" />
                    <Button type="button" :class="tool" :disabled="!templateName.trim()" @click="saveTemplate">
                        <Icon icon="lucide:bookmark-plus" class="size-4" />
                    </Button>
                </div>

                <div class="my-4 border-t border-flixer-border"></div>
                <h2 class="mb-2 text-xs font-semibold uppercase tracking-wide text-flixer-muted">Layers</h2>
                <BlockTree :blocks="page.draft.blocks" :selected-id="selectedBlock"
                    @select="selectedBlock = $event; editingBlock = ''" @move="() => {}"
                    @duplicate="duplicateBlock" @remove="removeBlock" />
            </aside>

            <div class="pane-splitter" role="separator" aria-orientation="vertical" aria-label="Resize left panel"
                @pointerdown="startPaneResize('left', $event)" @pointermove="movePaneResize"
                @pointerup="paneDrag = null" @pointercancel="paneDrag = null"></div>

            <!-- Center Panel: 1:1 WYSIWYG Canvas -->
            <section class="builder-preview h-full min-h-0 min-w-0 overflow-hidden p-4 sm:p-6" :aria-label="t('pageBuilder.preview')"
                :class="panning ? 'cursor-grabbing' : panKey ? 'cursor-grab' : ''"
                @wheel="onPreviewWheel" @pointerdown.capture="startPan" @pointermove="movePan"
                @pointerup="endPan" @pointercancel="endPan">
                <Transition name="preview-fade" mode="out-in">
                    <div :key="page.id" class="mx-auto flex min-h-[36rem] w-full flex-col overflow-hidden rounded border border-flixer-border bg-flixer-background text-flixer-text shadow-2xl transition-[max-width] duration-300 ease-out"
                        :class="preview === 'mobile' ? 'max-w-[390px]' : 'max-w-5xl'"
                        :style="{ transform: `translate(${panX}px, ${panY}px) scale(${zoom})`, transformOrigin: 'top center' }">
                        <div v-if="page.kind === 'page'"
                            class="preview-chrome pointer-events-none relative h-20 w-full shrink-0 select-none overflow-hidden"
                            aria-hidden="true">
                            <Header :links="getNavLinks()" :is-signing-out="false" :disable-scroll-collapse="true"
                                :force-mobile="preview === 'mobile'" />
                        </div>
                        <PageCanvas class="flex-1" :blocks="page.draft.blocks" editable :selected-id="selectedBlock"
                            :editing-id="editingBlock" :viewport="preview" :zoom="zoom" layout="free"
                            @select="selectedBlock = $event; if ($event !== editingBlock) editingBlock = ''"
                            @edit="editingBlock = $event"
                            @text="(id, value) => { const b = findBlock(page!.draft.blocks, id); if (b) b.text = value }"
                            @move="moveOnCanvas"
                            @drop-block="(type, pos) => addBlock(type as Exclude<PageBlockType, 'auth'>, pos)" />
                        <Transition name="mobile-bar">
                            <div v-if="page.kind === 'page' && preview === 'mobile'"
                                class="preview-chrome pointer-events-none relative h-20 w-full shrink-0 select-none overflow-hidden"
                                aria-hidden="true">
                                <MobileTabBar :tabs="getMobileTabs()" :force-visible="true" />
                            </div>
                        </Transition>
                    </div>
                </Transition>
            </section>

            <div class="pane-splitter" role="separator" aria-orientation="vertical" aria-label="Resize right panel"
                @pointerdown="startPaneResize('right', $event)" @pointermove="movePaneResize"
                @pointerup="paneDrag = null" @pointercancel="paneDrag = null"></div>

            <!-- Right Panel: Contextual Inspector -->
            <aside class="builder-right h-full overflow-y-auto border-flixer-border p-4" :inert="busy" :aria-busy="busy" data-agent-hidden>
                <template v-if="activeBlock">
                    <div class="flex items-center justify-between">
                        <h2 class="text-sm font-semibold capitalize">{{ activeBlock.type }} inspector</h2>
                        <div class="flex items-center gap-1">
                            <Button v-if="activeBlock.type !== 'auth'" type="button" :class="tool" title="Duplicate (Ctrl+D)"
                                @click="duplicateBlock(activeBlock.id)">
                                <Icon icon="lucide:copy" class="size-4" />
                            </Button>
                            <Button v-if="activeBlock.type !== 'auth'" type="button" :class="tool" title="Delete (Del)"
                                @click="removeBlock(activeBlock.id)">
                                <Icon icon="lucide:trash-2" class="size-4" />
                            </Button>
                            <Button type="button" :class="tool" title="Page settings" @click="selectedBlock = ''; editingBlock = ''">
                                <Icon icon="lucide:x" class="size-4" />
                            </Button>
                        </div>
                    </div>

                    <div class="mt-3 space-y-3">
                        <template v-if="activeBlock.type === 'text'">
                            <div class="flex gap-1">
                                <Button type="button" :class="tool" @click="formatText('**', '**')"><b>B</b></Button>
                                <Button type="button" :class="tool" @click="formatText('*', '*')"><i>I</i></Button>
                                <Button type="button" :class="tool" @click="formatText('[', '](https://)')">
                                    <Icon icon="lucide:link" class="size-4" />
                                </Button>
                            </div>
                            <label class="block text-xs text-flixer-muted">{{ t('pageBuilder.text') }}
                                <Textarea ref="textEditor" v-model:value="activeBlock.text" :maxlength="4000" rows="4" :class="field" />
                            </label>
                        </template>
                        <label v-else-if="activeBlock.type !== 'auth' && activeBlock.type !== 'columns' && activeBlock.type !== 'auth-field'"
                            class="block text-xs text-flixer-muted">{{ t('pageBuilder.text') }}
                            <Input v-model:value="activeBlock.text" :maxlength="160" :class="field" />
                        </label>

                        <label v-if="activeBlock.type === 'card' || activeBlock.type === 'hero'" class="block text-xs text-flixer-muted">
                            Description
                            <Textarea :value="activeBlock.description ?? ''" :maxlength="2000" rows="3" :class="field"
                                @value-change="activeBlock.description = $event" />
                        </label>
                        <label v-if="activeBlock.type === 'hero'" class="block text-xs text-flixer-muted">
                            Button label
                            <Input :value="activeBlock.buttonText ?? ''" :maxlength="80" :class="field"
                                @value-change="activeBlock.buttonText = $event" />
                        </label>
                        <label v-if="['button', 'video', 'card', 'hero', 'auth-action'].includes(activeBlock.type)"
                            class="block text-xs text-flixer-muted">{{ t('pageBuilder.link') }}
                            <Input :value="activeBlock.href ?? ''" :maxlength="2048" :class="field"
                                @value-change="activeBlock.href = $event" />
                        </label>
                        <label v-if="activeBlock.type === 'media-row'" class="block text-xs text-flixer-muted">
                            Source
                            <select :value="activeBlock.source ?? 'recent'" :class="field"
                                @change="activeBlock.source = ($event.target as HTMLSelectElement).value as MediaRowSource">
                                <option value="recent">Recently added</option>
                                <option value="continue">Continue watching</option>
                                <option value="library">Library</option>
                                <option value="collection">Collections</option>
                            </select>
                        </label>
                        <label v-if="activeBlock.type === 'media-row' && activeBlock.source === 'library'" class="block text-xs text-flixer-muted">
                            Library ID (optional)
                            <Input :value="activeBlock.sourceId ?? ''" :maxlength="80" :class="field"
                                @value-change="activeBlock.sourceId = $event" />
                        </label>
                        <label v-if="['image', 'card', 'hero'].includes(activeBlock.type)" class="block text-xs text-flixer-muted">
                            {{ t('pageBuilder.image') }}
                            <input type="file" accept="image/png,image/jpeg,image/webp" class="mt-1 block w-full text-xs" @change="readImage" />
                            <Button v-if="activeBlock.image" type="button" class="mt-1 text-xs text-flixer-muted underline"
                                @click="activeBlock.image = null">{{ t('pageBuilder.removeImage') }}</Button>
                        </label>

                        <div v-if="activeBlock.position" class="grid grid-cols-2 gap-2 border-t border-flixer-border pt-3">
                            <label class="text-xs text-flixer-muted">{{ t('pageBuilder.positionX') }}
                                <Input type="number" min="0" :max="100 - activeBlock.position[preview].width"
                                    :value="String(activeBlock.position[preview].x)" :class="field"
                                    @change="moveOnCanvas(activeBlock.id, preview, { ...activeBlock.position[preview], x: Math.max(0, Math.min(100 - activeBlock.position[preview].width, Number(($event.target as HTMLInputElement).value) || 0)) })" />
                            </label>
                            <label class="text-xs text-flixer-muted">{{ t('pageBuilder.positionY') }}
                                <Input type="number" min="0" max="5000"
                                    :value="String(activeBlock.position[preview].y)" :class="field"
                                    @change="moveOnCanvas(activeBlock.id, preview, { ...activeBlock.position[preview], y: Math.max(0, Math.min(5000, Number(($event.target as HTMLInputElement).value) || 0)) })" />
                            </label>
                            <label class="text-xs text-flixer-muted">{{ t('pageBuilder.width') }} (%)
                                <Input type="number" min="10" :max="100 - activeBlock.position[preview].x"
                                    :value="String(activeBlock.position[preview].width)" :class="field"
                                    @change="moveOnCanvas(activeBlock.id, preview, { ...activeBlock.position[preview], width: Math.max(10, Math.min(100 - activeBlock.position[preview].x, Number(($event.target as HTMLInputElement).value) || 100)) })" />
                            </label>
                            <label class="text-xs text-flixer-muted">Height (px)
                                <Input type="number" min="40" max="2000" placeholder="auto"
                                    :value="activeBlock.position[preview].height ? String(activeBlock.position[preview].height) : ''" :class="field"
                                    @change="(() => { const v = Number(($event.target as HTMLInputElement).value); const pos = { ...activeBlock!.position![preview] }; if (v >= 40 && v <= 2000) pos.height = v; else delete pos.height; moveOnCanvas(activeBlock!.id, preview, pos) })()" />
                            </label>
                        </div>

                        <div class="grid grid-cols-2 gap-2 border-t border-flixer-border pt-3">
                            <label class="text-xs text-flixer-muted">{{ t('pageBuilder.align') }}
                                <select :value="activeBlock.style?.align ?? 'left'" :class="field"
                                    @change="setStyle('align', ($event.target as HTMLSelectElement).value as PageBlockStyle['align'])">
                                    <option value="left">{{ t('pageBuilder.left') }}</option>
                                    <option value="center">{{ t('pageBuilder.center') }}</option>
                                    <option value="right">{{ t('pageBuilder.right') }}</option>
                                </select>
                            </label>
                            <label class="text-xs text-flixer-muted">{{ t('pageBuilder.spacing') }}
                                <select :value="activeBlock.style?.spacing ?? 'normal'" :class="field"
                                    @change="setStyle('spacing', ($event.target as HTMLSelectElement).value as PageBlockStyle['spacing'])">
                                    <option value="compact">{{ t('pageBuilder.compact') }}</option>
                                    <option value="normal">{{ t('pageBuilder.normal') }}</option>
                                    <option value="spacious">{{ t('pageBuilder.spacious') }}</option>
                                </select>
                            </label>
                            <label class="text-xs text-flixer-muted">Font size
                                <select :value="activeBlock.style?.fontSize ?? 'md'" :class="field"
                                    @change="setStyle('fontSize', ($event.target as HTMLSelectElement).value as PageBlockStyle['fontSize'])">
                                    <option value="sm">Small</option>
                                    <option value="md">Medium</option>
                                    <option value="lg">Large</option>
                                    <option value="xl">Extra large</option>
                                </select>
                            </label>
                            <label class="text-xs text-flixer-muted">Radius
                                <select :value="activeBlock.style?.radius ?? 'sm'" :class="field"
                                    @change="setStyle('radius', ($event.target as HTMLSelectElement).value as PageBlockStyle['radius'])">
                                    <option value="none">None</option>
                                    <option value="sm">Small</option>
                                    <option value="md">Medium</option>
                                    <option value="lg">Large</option>
                                    <option value="full">Pill</option>
                                </select>
                            </label>
                            <label class="text-xs text-flixer-muted">Shadow
                                <select :value="activeBlock.style?.shadow ?? 'none'" :class="field"
                                    @change="setStyle('shadow', ($event.target as HTMLSelectElement).value as PageBlockStyle['shadow'])">
                                    <option value="none">None</option>
                                    <option value="sm">Subtle</option>
                                    <option value="md">Medium</option>
                                    <option value="lg">Strong</option>
                                </select>
                            </label>
                            <label class="text-xs text-flixer-muted">Opacity (%)
                                <Input type="number" min="0" max="100" :value="String(activeBlock.style?.opacity ?? 100)" :class="field"
                                    @change="setStyle('opacity', Math.max(0, Math.min(100, Number(($event.target as HTMLInputElement).value) || 100)))" />
                            </label>
                            <label class="text-xs text-flixer-muted">{{ t('pageBuilder.color') }}
                                <input type="color" :value="activeBlock.style?.color ?? '#ffffff'" class="mt-1 block size-9"
                                    @input="setStyle('color', ($event.target as HTMLInputElement).value)" />
                            </label>
                            <label class="text-xs text-flixer-muted">{{ t('pageBuilder.background') }}
                                <span class="mt-1 flex items-center gap-2">
                                    <input type="color" :value="activeBlock.style?.background ?? '#14131d'" class="block size-9"
                                        @input="setStyle('background', ($event.target as HTMLInputElement).value)" />
                                    <Button type="button" :class="tool" :aria-pressed="!activeBlock.style?.background"
                                        title="Transparent" @click="setStyle('background', undefined)">
                                        <Icon icon="lucide:ban" class="size-4" />
                                    </Button>
                                </span>
                            </label>
                        </div>
                    </div>
                </template>

                <template v-else>
                    <h2 class="text-sm font-semibold">Page settings</h2>
                    <div class="mt-3 space-y-3">
                        <label class="block text-xs font-medium text-flixer-muted">{{ t('pageBuilder.pageTitle') }}
                            <Input v-model:value="page.title" :maxlength="80" :class="field" />
                        </label>
                        <label v-if="page.kind === 'page'" class="block text-xs font-medium text-flixer-muted">{{ t('pageBuilder.address') }}
                            <Input v-model:value="page.slug" :maxlength="80" :class="field" />
                        </label>
                        <label v-if="page.kind === 'page'" class="block text-xs font-medium text-flixer-muted">{{ t('pageBuilder.access') }}
                            <select :value="page.access ?? 'public'" :class="field"
                                @change="page.access = ($event.target as HTMLSelectElement).value as 'public' | 'signed-in'">
                                <option value="public">{{ t('pageBuilder.public') }}</option>
                                <option value="signed-in">Signed-in users</option>
                            </select>
                        </label>
                        <div v-if="page.kind === 'page' && page.published" class="space-y-2 border-t border-flixer-border pt-3 text-sm">
                            <label class="flex items-center gap-2">
                                <input type="checkbox" :checked="site.navigationIds.includes(page.id)" :disabled="busy"
                                    @change="setSiteOption('navigation', ($event.target as HTMLInputElement).checked)" />
                                {{ t('pageBuilder.showInNavigation') }}
                            </label>
                            <label class="flex items-center gap-2">
                                <input type="checkbox" :checked="site.homePageId === page.id" :disabled="busy"
                                    @change="setSiteOption('home', ($event.target as HTMLInputElement).checked)" />
                                {{ t('pageBuilder.useAsHome') }}
                            </label>
                        </div>
                        <div v-if="page.kind === 'page'" class="border-t border-flixer-border pt-3">
                            <label class="block text-xs text-flixer-muted">{{ t('pageBuilder.publishAt') }}
                                <input v-model="publishAt" type="datetime-local" :class="field" />
                            </label>
                            <Button type="button" :disabled="!publishAt"
                                class="mt-2 w-full rounded border border-flixer-border px-3 py-1.5 text-xs hover:bg-white/5 disabled:opacity-40"
                                @click="schedule">{{ t('pageBuilder.schedule') }}</Button>
                            <p v-if="page.scheduled" class="mt-2 text-xs text-flixer-muted">
                                {{ t('pageBuilder.scheduledFor', { at: new Date(page.scheduled.at).toLocaleString() }) }}
                                <Button type="button" class="ml-2 underline" @click="cancelSchedule">{{ t('pageBuilder.cancelSchedule') }}</Button>
                            </p>
                        </div>
                        <Button v-if="page.published" type="button"
                            class="w-full rounded border border-flixer-border px-3 py-1.5 text-xs hover:bg-white/5"
                            @click="unpublish">{{ t('pageBuilder.unpublish') }}</Button>
                        <Button v-if="page.kind === 'page'" type="button"
                            class="w-full rounded border border-red-500/40 px-3 py-1.5 text-xs text-red-300 hover:bg-red-500/10"
                            @click="removePage">Delete page</Button>
                        <div v-if="page.history?.length" class="border-t border-flixer-border pt-3">
                            <p class="text-xs font-medium text-flixer-muted">{{ t('pageBuilder.versions') }}</p>
                            <div class="mt-2 grid gap-1">
                                <Button v-for="version in page.history" :key="version.id" type="button"
                                    class="rounded border border-flixer-border px-2 py-1 text-left text-xs hover:bg-white/5"
                                    @click="restore(version.id)">{{ new Date(version.createdAt).toLocaleString() }}</Button>
                            </div>
                        </div>
                    </div>
                </template>
            </aside>
        </div>
    </main>
</template>

<style scoped>
@layer components.ui-sdk {
    :is([data-slot="button"], [data-slot="input"], [data-slot="textarea"]),
    [data-slot="button"]:hover {
        all: revert-layer;
    }
}

.builder-workspace {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
}

.builder-left,
.builder-right {
    border-bottom-width: 1px;
}

.builder-preview {
    background: color-mix(in srgb, var(--color-flixer-surface) 65%, var(--color-flixer-background));
}

.preview-chrome {
    transform: translateZ(0);
}

.preview-fade-enter-active,
.preview-fade-leave-active {
    transition: opacity 150ms ease;
}

.preview-fade-enter-from,
.preview-fade-leave-to {
    opacity: 0;
}

.mobile-bar-enter-active,
.mobile-bar-leave-active {
    transition: height 250ms ease, opacity 200ms ease;
}

.mobile-bar-enter-from,
.mobile-bar-leave-to {
    height: 0;
    opacity: 0;
}

.pane-splitter {
    display: none;
}

@media (min-width: 1024px) {
    .builder-workspace {
        grid-template-columns: var(--left-width, 16rem) 6px minmax(0, 1fr) 6px var(--right-width, 20rem);
        height: 100%;
    }

    .pane-splitter {
        display: block;
        cursor: col-resize;
        background: var(--color-flixer-border);
        touch-action: none;
        transition: background-color 150ms ease;
    }

    .pane-splitter:hover {
        background: var(--color-flixer-accent);
    }

    .builder-left,
    .builder-right {
        border-bottom-width: 0;
    }
}
</style>
