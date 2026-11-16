<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { cancelBuilderSchedule, createBuilderPage, createPageTemplate, defaultPagePosition, deleteBuilderPage, deletePageTemplate, getPageSiteSettings, listBuilderPages, listPageTemplates, publishBuilderPage, restoreBuilderVersion, saveBuilderPage, savePageSiteSettings, scheduleBuilderPage, unpublishBuilderPage, type BuilderPage, type PageBlock, type PageBlockType, type PagePosition, type AuthField, type PageSiteSettings, type ReusablePageBlock } from './pageBuilder'
import { saveAppearanceSettings } from '../../api/appearance'
import { refreshAppearance } from '../../composables/useAppearance'
import { confirmAction } from '../../composables/confirm'
import { notify } from '../../composables/notify'
import { describeRequestError } from '../../composables/useProfile'
import BlockTree from './BlockTree.vue'
import GrapesCanvas from './GrapesCanvas.vue'
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
const saved = ref('')
const busy = ref(false)
const loading = ref(true)
const preview = ref<'desktop' | 'mobile'>('desktop')
const publishAt = ref('')
const textEditor = ref<HTMLTextAreaElement | null>(null)
function findBlock(blocks: PageBlock[], id: string): PageBlock | undefined {
    for (const block of blocks) {
        if (block.id === id) return block
        for (const column of block.columns ?? []) { const found = findBlock(column, id); if (found) return found }
    }
}
const activeBlock = computed(() => findBlock(page.value?.draft.blocks ?? [], selectedBlock.value))
const missingAuthFields = computed(() => (['displayName', 'passkey', 'quickConnect', 'providers', 'resend'] as AuthField[]).filter((field) => !page.value?.draft.blocks.some((block) => block.type === 'auth-field' && block.field === field)))
const fingerprint = (value: BuilderPage) => JSON.stringify({ title: value.title, slug: value.slug, access: value.access ?? 'public', draft: value.draft })
const dirty = computed(() => page.value !== null && fingerprint(page.value) !== saved.value)
const field = 'mt-1 w-full rounded border border-flixer-border bg-flixer-background px-3 py-2 text-sm text-flixer-text outline-none focus:border-flixer-accent'
const tool = 'grid size-9 place-items-center rounded text-flixer-muted hover:bg-white/10 hover:text-flixer-text focus-visible:outline-2 focus-visible:outline-flixer-accent disabled:opacity-30'

function openPage(value: BuilderPage) {
    page.value = JSON.parse(JSON.stringify(value)) as BuilderPage
    saved.value = fingerprint(value)
    selectedBlock.value = page.value.draft.blocks[0]?.id ?? ''
}
function updatePage(value: BuilderPage) {
    const index = pages.value.findIndex((entry) => entry.id === value.id)
    if (index < 0) pages.value.push(value)
    else pages.value[index] = value
    openPage(value)
}
async function mayLeave() { return !dirty.value || await confirmAction(t('pageBuilder.discard')) }
onBeforeRouteLeave(async () => mayLeave())
onMounted(async () => {
    try {
        const [loadedPages, loadedSite, loadedTemplates] = await Promise.all([listBuilderPages(), getPageSiteSettings(), listPageTemplates()])
        pages.value = loadedPages
        site.value = loadedSite
        templates.value = loadedTemplates
        const initial = pages.value.find((entry) => entry.id === route.query.page) ?? pages.value[0]
        if (initial) openPage(initial)
    } catch (error) { notify.error(describeRequestError(error, t('pageBuilder.loadError'))) }
    finally { loading.value = false }
})
async function selectPage(value: BuilderPage) {
    if (page.value?.id !== value.id && await mayLeave()) openPage(value)
}
async function createPage() {
    if (busy.value || !(await mayLeave())) return
    busy.value = true
    try { updatePage(await createBuilderPage()) }
    catch (error) { notify.error(describeRequestError(error, t('pageBuilder.saveError'))) }
    finally { busy.value = false }
}
async function saveDraft(): Promise<BuilderPage | null> {
    if (!page.value) return null
    const result = await saveBuilderPage(page.value)
    updatePage(result)
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
        const first = pages.value[0]
        if (first) openPage(first)
    } catch (error) { notify.error(describeRequestError(error, t('pageBuilder.saveError'))) }
    finally { busy.value = false }
}
function addBlock(type: Exclude<PageBlockType, 'auth'>) {
    if (!page.value || page.value.draft.blocks.length >= 20) return
    const block: PageBlock = { id: crypto.randomUUID(), type, text: '', image: null }
    if (type === 'columns') block.columns = [[], []]
    if (type === 'button' || type === 'card' || type === 'video') block.href = ''
    if (type === 'card') block.description = ''
    if (type === 'auth-custom') block.text = t('pageBuilder.customField')
    if (type === 'auth-action') { block.text = t('pageBuilder.customAction'); block.href = ''; block.allowedFields = [] }
    if (page.value.draft.layout === 'free') {
        const index = page.value.draft.blocks.length
        block.position = { desktop: defaultPagePosition(page.value.draft.blocks, index, 'desktop'), mobile: defaultPagePosition(page.value.draft.blocks, index, 'mobile') }
    }
    page.value.draft.blocks.push(block)
    selectedBlock.value = block.id
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
function setLayout(layout: 'flow' | 'free') {
    if (!page.value) return
    if (layout === 'free') {
        for (const [index, block] of page.value.draft.blocks.entries()) {
            block.position ??= { desktop: defaultPagePosition(page.value.draft.blocks, index, 'desktop'), mobile: defaultPagePosition(page.value.draft.blocks, index, 'mobile') }
        }
    }
    page.value.draft.layout = layout
}
function moveOnCanvas(id: string, viewport: 'desktop' | 'mobile', position: PagePosition) {
    if (page.value?.draft.layout !== 'free') setLayout('free')
    const block = findBlock(page.value?.draft.blocks ?? [], id)
    if (!block) return
    block.position ??= { desktop: { x: 0, y: 0, width: 100 }, mobile: { x: 0, y: 0, width: 100 } }
    block.position[viewport] = position
}
function addOnCanvas(block: PageBlock) {
    if (!page.value || page.value.draft.blocks.length >= 20) return
    if (page.value.draft.layout !== 'free') setLayout('free')
    page.value.draft.blocks.push(block)
    selectedBlock.value = block.id
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
}
function duplicateBlock(id: string) {
    const blocks = findParent(page.value?.draft.blocks ?? [], id)
    const index = blocks?.findIndex((block) => block.id === id) ?? -1
    if (!blocks || index < 0 || blocks[index]?.type === 'auth') return
    const copy = JSON.parse(JSON.stringify(blocks[index])) as PageBlock
    const assignIds = (block: PageBlock) => { block.id = crypto.randomUUID(); block.columns?.flat().forEach(assignIds) }
    assignIds(copy)
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
    if (page.value.draft.layout === 'free') copy.position = { desktop: defaultPagePosition(page.value.draft.blocks, index, 'desktop'), mobile: defaultPagePosition(page.value.draft.blocks, index, 'mobile') }
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
function setStyle(key: 'align' | 'color' | 'background' | 'spacing', value: string) {
    if (!activeBlock.value) return
    const style = activeBlock.value.style ?? {}
    activeBlock.value.style = { ...style, [key]: value }
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
    <main class="min-h-screen bg-flixer-background text-flixer-text">
        <header class="flex flex-wrap items-center gap-3 border-b border-flixer-border px-4 py-3 sm:px-6">
            <button type="button" :class="tool" :aria-label="t('pageBuilder.back')" :title="t('pageBuilder.back')"
                @click="router.push({ name: 'admin', query: { tab: 'settings', page: 'appearance' } })">
                <Icon icon="lucide:arrow-left" class="size-5" />
            </button>
            <div class="min-w-0 flex-1">
                <h1 class="text-lg font-semibold">{{ t('pageBuilder.title') }}</h1>
                <p v-if="page" class="truncate text-xs text-flixer-muted">{{ page.title }}<span v-if="dirty"> · {{
                    t('pageBuilder.unsaved') }}</span></p>
            </div>
            <button type="button" :disabled="busy || !page"
                class="rounded border border-flixer-border px-3 py-2 text-sm font-semibold hover:bg-white/5 disabled:opacity-40"
                @click="save">{{ t('pageBuilder.save') }}</button>
            <button type="button" :disabled="busy || !page"
                class="rounded bg-flixer-primary px-3 py-2 text-sm font-semibold text-white hover:bg-flixer-secondary disabled:opacity-40"
                @click="publish">{{ page?.kind === 'login' ? t('pageBuilder.publishLogin') : t('pageBuilder.publish')
                }}</button>
        </header>
        <p v-if="loading" role="status" class="p-6 text-flixer-muted">{{ t('pageBuilder.loading') }}</p>
        <div v-else-if="page" class="builder-workspace">
            <aside class="builder-sidebar border-flixer-border p-4" :inert="busy" :aria-busy="busy">
                <div class="flex items-center justify-between">
                    <h2 class="text-sm font-semibold">{{ t('pageBuilder.pages') }}</h2><button type="button"
                        :class="tool" :disabled="busy" :title="t('pageBuilder.addPage')"
                        :aria-label="t('pageBuilder.addPage')" @click="createPage">
                        <Icon icon="lucide:plus" class="size-4" />
                    </button>
                </div>
                <div class="mt-2 grid gap-1"><button v-for="entry in pages" :key="entry.id" type="button"
                        class="truncate rounded px-3 py-2 text-left text-sm hover:bg-white/5"
                        :class="entry.id === page.id ? 'bg-flixer-primary/20 text-flixer-text' : 'text-flixer-muted'"
                        @click="selectPage(entry)">{{ entry.title }}</button></div>
                <div class="my-5 border-t border-flixer-border"></div>
                <label class="block text-xs font-medium text-flixer-muted">{{ t('pageBuilder.pageTitle') }}<input
                        v-model="page.title" :maxlength="80" :class="field" /></label>
                <label v-if="page.kind === 'page'" class="mt-3 block text-xs font-medium text-flixer-muted">{{
                    t('pageBuilder.address') }}<span
                        class="mt-1 flex items-center rounded border border-flixer-border bg-flixer-background pl-2 text-sm"><span>/pages/</span><input
                            v-model="page.slug" :maxlength="80"
                            class="min-w-0 flex-1 px-2 py-2 text-flixer-text outline-none" /></span></label>
                <label v-if="page.kind === 'page'" class="mt-3 block text-xs font-medium text-flixer-muted">{{
                    t('pageBuilder.access') }}<select v-model="page.access" :class="field">
                        <option value="public">{{ t('pageBuilder.public') }}</option>
                        <option value="signed-in">{{ t('pageBuilder.signedIn') }}</option>
                    </select></label>
                <a v-if="page.published && page.kind === 'page'" :href="`/pages/${page.published.slug}`" target="_blank"
                    rel="noopener"
                    class="mt-3 inline-flex items-center gap-1 text-xs text-flixer-accent hover:underline">{{
                        t('pageBuilder.viewPage') }}
                    <Icon icon="lucide:external-link" class="size-3" />
                </a>
                <div class="mt-3 flex flex-wrap gap-3 text-xs"><button v-if="page.published" type="button"
                        class="text-flixer-muted underline hover:text-flixer-text" :disabled="busy"
                        @click="unpublish">{{ t('pageBuilder.unpublish') }}</button><button v-if="page.kind === 'page'"
                        type="button" class="text-red-400 underline" :disabled="busy" @click="removePage">{{
                            t('pageBuilder.delete') }}</button></div>
                <div v-if="page.kind === 'page' && page.published" class="mt-4 grid gap-2 text-sm"><label
                        class="flex items-center gap-2"><input type="checkbox"
                            :checked="site.navigationIds.includes(page.id)" :disabled="busy"
                            @change="setSiteOption('navigation', ($event.target as HTMLInputElement).checked)" />{{
                                t('pageBuilder.showInNavigation') }}</label><label class="flex items-center gap-2"><input
                            type="checkbox" :checked="site.homePageId === page.id" :disabled="busy"
                            @change="setSiteOption('home', ($event.target as HTMLInputElement).checked)" />{{
                                t('pageBuilder.useAsHome') }}</label></div>
                <div v-if="page.kind === 'page'" class="mt-4 border-t border-flixer-border pt-4"><label
                        class="block text-xs text-flixer-muted">{{
                            t('pageBuilder.publishAt') }}<input v-model="publishAt" type="datetime-local"
                            :class="field" /></label><button type="button"
                        class="mt-2 rounded border border-flixer-border px-3 py-2 text-xs disabled:opacity-40"
                        :disabled="busy || !publishAt" @click="schedule">{{ t('pageBuilder.schedule') }}</button>
                    <div v-if="page.scheduled" class="mt-2 text-xs text-flixer-muted">{{ t('pageBuilder.scheduledFor', {
                        date: new Date(page.scheduled.at).toLocaleString()
                    }) }} <button type="button" class="underline" :disabled="busy" @click="cancelSchedule">{{
                            t('pageBuilder.cancelSchedule') }}</button>
                    </div>
                </div>
                <details v-if="page.history?.length" class="mt-4 text-sm">
                    <summary class="cursor-pointer font-semibold">{{ t('pageBuilder.versions') }}</summary>
                    <ul class="mt-2 grid gap-2">
                        <li v-for="version in page.history" :key="version.id"
                            class="flex items-center justify-between gap-2 text-xs text-flixer-muted"><span>{{ new
                                Date(version.createdAt).toLocaleString() }}</span><button type="button"
                                class="text-flixer-accent underline" :disabled="busy" @click="restore(version.id)">{{
                                    t('pageBuilder.restore') }}</button></li>
                    </ul>
                </details>
                <div class="my-5 border-t border-flixer-border"></div>
                <div class="flex items-center justify-between">
                    <h2 class="text-sm font-semibold">{{ t('pageBuilder.blocks') }}</h2><span
                        class="text-xs text-flixer-muted">{{ page.draft.blocks.length }}/20</span>
                </div>
                <label class="mt-3 block text-xs text-flixer-muted">{{ t('pageBuilder.layout') }}<select
                        :value="page.draft.layout ?? 'flow'" :class="field"
                        @change="setLayout(($event.target as HTMLSelectElement).value as 'flow' | 'free')">
                        <option value="flow" :disabled="page.draft.blocks.some((block) => block.type === 'auth-field')">
                            {{ t('pageBuilder.flow') }}</option>
                        <option value="free">{{ t('pageBuilder.free') }}</option>
                    </select></label>
                <BlockTree class="mt-2" :blocks="page.draft.blocks" :selected-id="selectedBlock"
                    @select="selectedBlock = $event" @remove="removeBlock" @duplicate="duplicateBlock" />
                <div class="mt-3 flex flex-wrap gap-2"><button
                        v-for="type in ['heading', 'text', 'image', 'button', 'video', 'card', 'columns'] as const"
                        :key="type" type="button" :disabled="page.draft.blocks.length >= 20"
                        class="rounded border border-flixer-border px-2 py-1.5 text-xs hover:bg-white/5 disabled:opacity-40"
                        @click="addBlock(type)">+ {{ t(`pageBuilder.block.${type}`) }}</button></div>
                <button v-if="page.kind === 'login' && page.draft.blocks.some((block) => block.type === 'auth')"
                    type="button"
                    class="mt-3 rounded border border-flixer-border px-3 py-2 text-xs hover:bg-white/5 disabled:opacity-40"
                    :disabled="page.draft.blocks.length + 9 > 20" @click="createCustomForm">{{
                        t('pageBuilder.createCustomForm') }}</button>
                <div v-if="page.kind === 'login' && page.draft.blocks.some((block) => block.type === 'auth-field')"
                    class="mt-3 flex flex-wrap gap-2"><button v-for="type in ['auth-custom', 'auth-action'] as const"
                        :key="type" type="button" :disabled="page.draft.blocks.length >= 20"
                        class="rounded border border-flixer-border px-2 py-1.5 text-xs hover:bg-white/5 disabled:opacity-40"
                        @click="addBlock(type)">+ {{ t(`pageBuilder.block.${type}`) }}</button><button
                        v-for="authField in missingAuthFields" :key="authField" type="button"
                        :disabled="page.draft.blocks.length >= 20"
                        class="rounded border border-flixer-border px-2 py-1.5 text-xs hover:bg-white/5 disabled:opacity-40"
                        @click="addAuthField(authField)">+ {{ t(`pageBuilder.authField.${authField}`) }}</button></div>
                <details class="mt-4 border-t border-flixer-border pt-4">
                    <summary class="cursor-pointer text-sm font-semibold">{{ t('pageBuilder.reusableBlocks') }}
                    </summary>
                    <div class="mt-3 grid gap-2"><label class="text-xs text-flixer-muted">{{
                        t('pageBuilder.templateName') }}<input v-model="templateName" maxlength="80"
                                :class="field" /></label><button type="button"
                            class="rounded border border-flixer-border px-2 py-2 text-xs disabled:opacity-40"
                            :disabled="busy || !templateName.trim() || !activeBlock || ['auth', 'auth-field', 'auth-custom', 'auth-action'].includes(activeBlock.type)"
                            @click="saveTemplate">{{ t('pageBuilder.saveTemplate') }}</button><select
                            v-model="selectedTemplate" :aria-label="t('pageBuilder.reusableBlocks')" :class="field">
                            <option value="">{{ t('pageBuilder.chooseTemplate') }}</option>
                            <option v-for="entry in templates" :key="entry.id" :value="entry.id">{{ entry.name }}
                            </option>
                        </select>
                        <div class="flex gap-2"><button type="button"
                                class="rounded border border-flixer-border px-2 py-2 text-xs disabled:opacity-40"
                                :disabled="!selectedTemplate || page.draft.blocks.length >= 20"
                                @click="insertTemplate">{{ t('pageBuilder.insertTemplate') }}</button><button
                                type="button" :class="tool" :disabled="busy || !selectedTemplate"
                                :aria-label="t('pageBuilder.deleteTemplate')" :title="t('pageBuilder.deleteTemplate')"
                                @click="removeTemplate">
                                <Icon icon="lucide:trash-2" class="size-4" />
                            </button></div>
                    </div>
                </details>
                <div v-if="activeBlock && activeBlock.type !== 'auth'" class="mt-5 border-t border-flixer-border pt-4">
                    <label v-if="activeBlock.type === 'heading'" class="block text-xs text-flixer-muted">{{
                        t('pageBuilder.heading') }}<input v-model="activeBlock.text" maxlength="160"
                            :class="field" /></label>
                    <div v-else-if="activeBlock.type === 'text'"><label class="block text-xs text-flixer-muted">{{
                        t('pageBuilder.text') }}<textarea ref="textEditor" v-model="activeBlock.text"
                                maxlength="4000" rows="6" :class="field"></textarea></label>
                        <div class="mt-1 flex gap-1"><button type="button" :class="tool"
                                :aria-label="t('pageBuilder.bold')" :title="t('pageBuilder.bold')" @mousedown.prevent
                                @click="formatText('**', '**')">
                                <Icon icon="lucide:bold" class="size-4" />
                            </button><button type="button" :class="tool" :aria-label="t('pageBuilder.italic')"
                                :title="t('pageBuilder.italic')" @mousedown.prevent @click="formatText('*', '*')">
                                <Icon icon="lucide:italic" class="size-4" />
                            </button><button type="button" :class="tool" :aria-label="t('pageBuilder.link')"
                                :title="t('pageBuilder.link')" @mousedown.prevent
                                @click="formatText('[', '](https://)')">
                                <Icon icon="lucide:link" class="size-4" />
                            </button><button type="button" :class="tool" :aria-label="t('pageBuilder.list')"
                                :title="t('pageBuilder.list')" @mousedown.prevent @click="formatText('- ')">
                                <Icon icon="lucide:list" class="size-4" />
                            </button></div>
                    </div>
                    <label v-if="['button', 'card', 'auth-custom', 'auth-action'].includes(activeBlock.type)"
                        class="block text-xs text-flixer-muted">{{ t('pageBuilder.heading') }}<input
                            v-model="activeBlock.text" maxlength="160" :class="field" /></label>
                    <label v-if="activeBlock.type === 'card'" class="mt-3 block text-xs text-flixer-muted">{{
                        t('pageBuilder.text') }}<textarea v-model="activeBlock.description" maxlength="2000" rows="4"
                            :class="field"></textarea></label>
                    <label v-if="['button', 'video', 'card', 'auth-action'].includes(activeBlock.type)"
                        class="mt-3 block text-xs text-flixer-muted">{{ t('pageBuilder.url') }}<input
                            v-model="activeBlock.href" type="url" maxlength="2048" :class="field" /></label>
                    <fieldset v-if="activeBlock.type === 'auth-action'" class="mt-3 grid gap-2">
                        <legend class="text-xs text-flixer-muted">{{ t('pageBuilder.allowedFields') }}</legend><label
                            v-for="fieldBlock in page.draft.blocks.filter((block) => block.type === 'auth-custom')"
                            :key="fieldBlock.id" class="flex items-center gap-2 text-sm"><input
                                v-model="activeBlock.allowedFields" type="checkbox" :value="fieldBlock.id" />{{
                                    fieldBlock.text }}</label>
                    </fieldset>
                    <template v-if="activeBlock.type === 'image' || activeBlock.type === 'card'"><label
                            class="mt-3 block text-xs text-flixer-muted">{{ t('pageBuilder.image') }}<input type="file"
                                accept="image/png,image/jpeg,image/webp" class="mt-2 block w-full text-xs"
                                @change="readImage" /></label><label class="mt-3 block text-xs text-flixer-muted">{{
                                    t(activeBlock.type === 'card' ? 'pageBuilder.heading' : 'pageBuilder.altText') }}<input
                                v-model="activeBlock.text" maxlength="160" :class="field" /></label><button
                            v-if="activeBlock.image" type="button" class="mt-2 text-xs text-flixer-muted underline"
                            @click="activeBlock.image = null">{{
                                t('pageBuilder.removeImage') }}</button></template>
                </div>
                <div v-if="activeBlock" class="mt-4 grid grid-cols-2 gap-3">
                    <label v-if="page.draft.layout === 'free' && activeBlock.position"
                        class="text-xs text-flixer-muted">{{
                            t('pageBuilder.positionX') }}<input type="number" min="0"
                            :max="100 - activeBlock.position[preview].width" :value="activeBlock.position[preview].x"
                            :class="field"
                            @change="moveOnCanvas(activeBlock.id, preview, { ...activeBlock.position[preview], x: Math.max(0, Math.min(100 - activeBlock.position[preview].width, Number(($event.target as HTMLInputElement).value) || 0)) })" /></label>
                    <label v-if="page.draft.layout === 'free' && activeBlock.position"
                        class="text-xs text-flixer-muted">{{
                            t('pageBuilder.positionY') }}<input type="number" min="0" max="5000"
                            :value="activeBlock.position[preview].y" :class="field"
                            @change="moveOnCanvas(activeBlock.id, preview, { ...activeBlock.position[preview], y: Math.max(0, Math.min(5000, Number(($event.target as HTMLInputElement).value) || 0)) })" /></label>
                    <label v-if="page.draft.layout === 'free' && activeBlock.position"
                        class="text-xs text-flixer-muted">{{
                            t('pageBuilder.width') }}<input type="number" min="10" max="100"
                            :value="activeBlock.position[preview].width" :class="field"
                            @change="moveOnCanvas(activeBlock.id, preview, { ...activeBlock.position[preview], width: Math.max(10, Math.min(100 - activeBlock.position[preview].x, Number(($event.target as HTMLInputElement).value) || 100)) })" /></label>
                    <label class="text-xs text-flixer-muted">{{ t('pageBuilder.align') }}<select
                            :value="activeBlock.style?.align ?? 'left'" :class="field"
                            @change="setStyle('align', ($event.target as HTMLSelectElement).value)">
                            <option value="left">{{ t('pageBuilder.left') }}</option>
                            <option value="center">{{ t('pageBuilder.center') }}</option>
                            <option value="right">{{ t('pageBuilder.right') }}</option>
                        </select></label>
                    <label class="text-xs text-flixer-muted">{{ t('pageBuilder.spacing') }}<select
                            :value="activeBlock.style?.spacing ?? 'normal'" :class="field"
                            @change="setStyle('spacing', ($event.target as HTMLSelectElement).value)">
                            <option value="compact">{{ t('pageBuilder.compact') }}</option>
                            <option value="normal">{{ t('pageBuilder.normal') }}</option>
                            <option value="spacious">{{ t('pageBuilder.spacious') }}</option>
                        </select></label>
                    <label class="text-xs text-flixer-muted">{{ t('pageBuilder.color') }}<input type="color"
                            :value="activeBlock.style?.color ?? '#ffffff'" class="mt-1 block size-9"
                            @input="setStyle('color', ($event.target as HTMLInputElement).value)" /></label>
                    <label class="text-xs text-flixer-muted">{{ t('pageBuilder.background') }}<input type="color"
                            :value="activeBlock.style?.background ?? '#14131d'" class="mt-1 block size-9"
                            @input="setStyle('background', ($event.target as HTMLInputElement).value)" /></label>
                </div>
            </aside>
            <section class="builder-preview min-w-0 p-4 sm:p-6" :aria-label="t('pageBuilder.preview')">
                <div class="mx-auto mb-4 flex max-w-5xl items-center justify-between">
                    <h2 class="text-sm font-semibold">{{ t('pageBuilder.preview') }}</h2>
                    <div class="flex rounded border border-flixer-border"><button
                            v-for="mode in ['desktop', 'mobile'] as const" :key="mode" type="button" :class="tool"
                            :aria-pressed="preview === mode" :title="t(`pageBuilder.${mode}`)"
                            :aria-label="t(`pageBuilder.${mode}`)" @click="preview = mode">
                            <Icon :icon="mode === 'desktop' ? 'lucide:monitor' : 'lucide:smartphone'" class="size-4" />
                        </button></div>
                </div>
                <div class="mx-auto min-h-[32rem] overflow-hidden border border-flixer-border bg-flixer-background"
                    :class="preview === 'mobile' ? 'max-w-[390px]' : 'max-w-5xl'">
                    <GrapesCanvas :key="page.id" :blocks="page.draft.blocks" :viewport="preview"
                        :selected-id="selectedBlock" :layout="page.draft.layout ?? 'flow'"
                        @select="selectedBlock = $event" @move="moveOnCanvas" @add="addOnCanvas" />
                </div>
            </section>
        </div>
    </main>
</template>

<style scoped>
.builder-workspace {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
}

.builder-sidebar {
    border-bottom-width: 1px;
}

.builder-preview {
    background: color-mix(in srgb, var(--color-flixer-surface) 65%, var(--color-flixer-background));
}

@media (min-width: 1024px) {
    .builder-workspace {
        grid-template-columns: 19rem minmax(0, 1fr);
        min-height: calc(100dvh - 65px);
    }

    .builder-sidebar {
        border-right-width: 1px;
        border-bottom-width: 0;
    }
}
</style>