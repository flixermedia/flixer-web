<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import DOMPurify from 'dompurify'
import { marked } from 'marked'
import { Textarea } from '@ui-sdk/vue/textarea'
import { browseMedia, getHomeContent } from '../../api/media'
import AuthImage from '../ui/AuthImage.vue'
import type { PageBlock } from './pageBuilder'

const props = defineProps<{ block: PageBlock; editable?: boolean; selectedId?: string; editingId?: string }>()
const emit = defineEmits<{ select: [id: string]; edit: [id: string]; text: [id: string, value: string] }>()
const FONT_SIZE = { sm: '0.875rem', md: '1rem', lg: '1.25rem', xl: '1.75rem' } as const
const RADIUS = { none: '0px', sm: '4px', md: '10px', lg: '18px', full: '9999px' } as const
const SHADOW = {
    none: 'none',
    sm: '0 2px 8px rgba(0,0,0,0.25)',
    md: '0 8px 24px rgba(0,0,0,0.4)',
    lg: '0 16px 40px rgba(0,0,0,0.55)',
} as const
const style = computed(() => {
    const s = props.block.style
    return {
        textAlign: s?.align,
        color: /^#[0-9a-f]{6}$/i.test(s?.color ?? '') ? s?.color : undefined,
        backgroundColor: /^#[0-9a-f]{6}$/i.test(s?.background ?? '') ? s?.background : undefined,
        fontSize: s?.fontSize ? FONT_SIZE[s.fontSize] : undefined,
        borderRadius: s?.radius ? RADIUS[s.radius] : undefined,
        boxShadow: s?.shadow ? SHADOW[s.shadow] : undefined,
        opacity: typeof s?.opacity === 'number' ? String(Math.max(0, Math.min(100, s.opacity)) / 100) : undefined,
    }
})
const markdown = computed(() => DOMPurify.sanitize(marked.parse(props.block.text, { async: false }), { ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'a', 'blockquote', 'code'], ALLOWED_ATTR: ['href', 'title'] }))
const safeHref = computed(() => {
    const href = props.block.href ?? ''
    if (/^\/(?!\/)/.test(href) || /^#[a-zA-Z0-9_-]+$/.test(href)) return href
    try { const url = new URL(href); return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password ? url.href : '' } catch { return '' }
})
const mediaCards = ref<{ id: string; title: string; imageItemId: string; image: number | null }[]>([])
async function loadMediaRow() {
    if (props.block.type !== 'media-row') return
    try {
        const source = props.block.source ?? 'recent'
        if (source === 'continue' || source === 'library') {
            const home = await getHomeContent()
            if (source === 'continue') {
                mediaCards.value = home.continueWatching.slice(0, 8).map((c) => ({ id: c.id, title: c.title, imageItemId: c.imageItemId, image: c.imageIndex }))
                return
            }
            const combined = [...home.recentMovies, ...home.recentShows, ...home.recentAlbums]
            mediaCards.value = combined.slice(0, 8).map((c) => ({ id: c.id, title: c.title, imageItemId: c.id, image: c.poster }))
            return
        }
        const browse = await browseMedia(source === 'collection' ? 'collections' : 'movies', 'added', 0)
        mediaCards.value = browse.items.slice(0, 8).map((c) => ({ id: c.id, title: c.title, imageItemId: c.id, image: c.poster }))
    } catch {
        mediaCards.value = []
    }
}
onMounted(() => { void loadMediaRow() })
watch(() => [props.block.type, props.block.source, props.block.sourceId], () => { void loadMediaRow() })
</script>

<template>
    <div class="page-block"
        :class="[`spacing-${block.style?.spacing ?? 'normal'}`, { selected: editable && selectedId === block.id }]"
        :style="style" @click.stop="editable && emit('select', block.id)"
        @dblclick.stop="editable && (block.type === 'heading' || block.type === 'text') && emit('edit', block.id)">
        <template v-if="editable && editingId === block.id && (block.type === 'heading' || block.type === 'text')">
            <Textarea :value="block.text" :aria-label="block.type" rows="3" class="inline-editor" data-agent-hidden
                @value-change="emit('text', block.id, $event)" />
        </template>
        <h2 v-else-if="block.type === 'heading'" class="page-heading">{{ block.text || (editable ? 'Heading' : '') }}</h2>
        <div v-else-if="block.type === 'text'" class="page-text" v-html="block.text ? markdown : (editable ? '<p>Text block — double-click to edit</p>' : '')"></div>
        <img v-else-if="block.type === 'image' && block.image" class="page-image" :src="block.image"
            :alt="block.text" />
        <div v-else-if="block.type === 'image' && editable" class="page-placeholder">Image (upload in inspector)</div>
        <a v-else-if="block.type === 'button' && (safeHref || editable)" :href="safeHref || '#'" class="page-button"
            @click="editable && $event.preventDefault()">{{ block.text || 'Button' }}</a>
        <video v-else-if="block.type === 'video' && safeHref" class="page-video" :src="safeHref" controls
            preload="metadata"></video>
        <div v-else-if="block.type === 'video' && editable" class="page-placeholder">Video (set URL in inspector)</div>
        <section v-else-if="block.type === 'hero'" class="page-hero">
            <img v-if="block.image" :src="block.image" :alt="block.text" class="page-hero-bg" />
            <div class="page-hero-scrim"></div>
            <div class="page-hero-body">
                <h2 class="page-hero-title">{{ block.text || (editable ? 'Hero title' : '') }}</h2>
                <p v-if="block.description || editable" class="page-hero-desc">{{ block.description || 'Add a subtitle in the inspector' }}</p>
                <a v-if="block.buttonText || safeHref" :href="safeHref || '#'" class="page-button mt-4"
                    @click="editable && $event.preventDefault()">{{ block.buttonText || 'Watch now' }}</a>
            </div>
        </section>
        <section v-else-if="block.type === 'media-row'" class="page-media-row">
            <h3 v-if="block.text || editable" class="mb-3 text-base font-semibold">{{ block.text || (block.source === 'continue' ? 'Continue Watching' : 'Recently Added') }}</h3>
            <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <template v-if="mediaCards.length">
                    <RouterLink v-for="card in mediaCards.slice(0, 4)" :key="card.id" :to="`/items/${card.id}`"
                        class="group block overflow-hidden rounded border border-flixer-border bg-flixer-surface"
                        @click="editable && $event.preventDefault()">
                        <div class="aspect-[2/3] w-full overflow-hidden bg-black/30">
                            <AuthImage v-if="card.image !== null" :item-id="card.imageItemId" :index="card.image"
                                :alt="card.title" img-class="size-full object-cover transition group-hover:scale-105" />
                        </div>
                        <p class="truncate p-2 text-xs font-medium">{{ card.title }}</p>
                    </RouterLink>
                </template>
                <template v-else-if="editable">
                    <div v-for="n in 4" :key="n" class="overflow-hidden rounded border border-flixer-border bg-flixer-surface/60">
                        <div class="aspect-[2/3] w-full bg-white/5"></div>
                        <div class="m-2 h-3 w-2/3 rounded bg-white/10"></div>
                    </div>
                </template>
            </div>
        </section>
        <article v-else-if="block.type === 'card'" class="page-card"><img v-if="block.image" :src="block.image"
                :alt="block.text" class="page-image" />
            <div class="card-content">
                <h3>{{ block.text || (editable ? 'Card title' : '') }}</h3>
                <p>{{ block.description }}</p><a v-if="safeHref" :href="safeHref"
                    @click="editable && $event.preventDefault()">{{ safeHref }}</a>
            </div>
        </article>
        <div v-else-if="block.type === 'columns'" class="page-columns"
            :style="{ '--columns': block.columns?.length ?? 2 }">
            <div v-for="(column, index) in block.columns" :key="index" class="page-column">
                <PageBlockView v-for="child in column" :key="child.id" :block="child" :editable="editable"
                    :selected-id="selectedId" :editing-id="editingId" @select="emit('select', $event)"
                    @edit="emit('edit', $event)" @text="(id, value) => emit('text', id, value)" />
            </div>
        </div>
        <slot v-else-if="block.type === 'auth'" name="auth" />
        <slot v-else-if="['auth-field', 'auth-custom', 'auth-action'].includes(block.type)" name="auth-field"
            :block="block" />
    </div>
</template>

<style scoped>
@layer components.ui-sdk {
    [data-slot="textarea"] {
        all: revert-layer;
    }
}

.page-block {
    min-width: 0;
    overflow-wrap: anywhere;
}

.page-block.selected {
    outline: 2px solid var(--color-flixer-accent);
    outline-offset: 4px;
}

.spacing-compact {
    padding: .25rem;
}

.spacing-spacious {
    padding: 2rem;
}

.page-heading {
    font-size: 2em;
    line-height: 1.2;
    font-weight: 700;
}

.page-placeholder {
    padding: 1.5rem;
    border: 1px dashed var(--color-flixer-border);
    border-radius: 4px;
    text-align: center;
    font-size: .875rem;
    color: var(--color-flixer-muted);
}

.page-hero {
    position: relative;
    overflow: hidden;
    min-height: 16rem;
    border-radius: inherit;
    border: 1px solid var(--color-flixer-border);
    background: linear-gradient(135deg, color-mix(in srgb, var(--color-flixer-primary) 30%, var(--color-flixer-surface)), var(--color-flixer-background));
    display: flex;
    align-items: flex-end;
    padding: 2rem;
}

.page-hero-bg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.page-hero-scrim {
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, rgba(8, 8, 17, 0.92), rgba(8, 8, 17, 0.25));
}

.page-hero-body {
    position: relative;
    z-index: 1;
    max-width: 40rem;
}

.page-hero-title {
    font-size: 2rem;
    font-weight: 800;
    line-height: 1.15;
    color: #fff;
}

.page-hero-desc {
    margin-top: .5rem;
    font-size: 1rem;
    color: rgba(255, 255, 255, 0.85);
}

.page-text {
    line-height: 1.7;
    color: inherit;
}

.page-text :deep(p + p) {
    margin-top: 1rem;
}

.page-text :deep(a) {
    color: var(--color-flixer-accent);
    text-decoration: underline;
}

.page-text :deep(ul),
.page-text :deep(ol) {
    padding-left: 1.5rem;
    list-style: revert;
}

.page-image {
    display: block;
    width: 100%;
    max-height: 32rem;
    object-fit: contain;
}

.page-button {
    display: inline-block;
    border-radius: 4px;
    padding: .75rem 1.25rem;
    background: var(--color-flixer-primary);
    color: white;
    font-weight: 600;
}

.page-video {
    display: block;
    width: 100%;
    max-height: 32rem;
    background: black;
}

.page-card {
    overflow: hidden;
    border: 1px solid var(--color-flixer-border);
    border-radius: 4px;
    background: var(--color-flixer-surface);
}

.card-content {
    padding: 1rem;
}

.card-content h3 {
    font-weight: 700;
}

.card-content p {
    margin-top: .5rem;
    white-space: pre-wrap;
}

.card-content a {
    display: inline-block;
    margin-top: .75rem;
    color: var(--color-flixer-accent);
    overflow-wrap: anywhere;
}

.page-columns {
    display: grid;
    grid-template-columns: repeat(var(--columns), minmax(0, 1fr));
    gap: 1.5rem;
}

.page-column {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.inline-editor {
    display: block;
    width: 100%;
    padding: .75rem;
    background: var(--color-flixer-surface);
    border: 1px solid var(--color-flixer-accent);
    color: var(--color-flixer-text);
}

@container (max-width: 40rem) {
    .page-columns {
        grid-template-columns: minmax(0, 1fr);
    }
}
</style>