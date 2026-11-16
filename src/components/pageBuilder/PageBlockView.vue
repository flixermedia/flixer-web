<script setup lang="ts">
import { computed } from 'vue'
import DOMPurify from 'dompurify'
import { marked } from 'marked'
import type { PageBlock } from './pageBuilder'

const props = defineProps<{ block: PageBlock; editable?: boolean; selectedId?: string }>()
const emit = defineEmits<{ select: [id: string]; text: [id: string, value: string] }>()
const style = computed(() => ({
    textAlign: props.block.style?.align,
    color: /^#[0-9a-f]{6}$/i.test(props.block.style?.color ?? '') ? props.block.style?.color : undefined,
    backgroundColor: /^#[0-9a-f]{6}$/i.test(props.block.style?.background ?? '') ? props.block.style?.background : undefined,
}))
const markdown = computed(() => DOMPurify.sanitize(marked.parse(props.block.text, { async: false }), { ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'a', 'blockquote', 'code'], ALLOWED_ATTR: ['href', 'title'] }))
const safeHref = computed(() => {
    const href = props.block.href ?? ''
    if (/^\/(?!\/)/.test(href) || /^#[a-zA-Z0-9_-]+$/.test(href)) return href
    try { const url = new URL(href); return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password ? url.href : '' } catch { return '' }
})
</script>

<template>
    <div class="page-block"
        :class="[`spacing-${block.style?.spacing ?? 'normal'}`, { selected: editable && selectedId === block.id }]"
        :style="style" @click.stop="editable && emit('select', block.id)">
        <template v-if="editable && selectedId === block.id && (block.type === 'heading' || block.type === 'text')">
            <textarea :value="block.text" :aria-label="block.type" rows="3" class="inline-editor"
                @input="emit('text', block.id, ($event.target as HTMLTextAreaElement).value)"></textarea>
        </template>
        <h2 v-else-if="block.type === 'heading'" class="page-heading">{{ block.text }}</h2>
        <div v-else-if="block.type === 'text'" class="page-text" v-html="markdown"></div>
        <img v-else-if="block.type === 'image' && block.image" class="page-image" :src="block.image"
            :alt="block.text" />
        <a v-else-if="block.type === 'button' && safeHref" :href="safeHref" class="page-button"
            @click="editable && $event.preventDefault()">{{ block.text }}</a>
        <video v-else-if="block.type === 'video' && safeHref" class="page-video" :src="safeHref" controls
            preload="metadata"></video>
        <article v-else-if="block.type === 'card'" class="page-card"><img v-if="block.image" :src="block.image"
                :alt="block.text" class="page-image" />
            <div class="card-content">
                <h3>{{ block.text }}</h3>
                <p>{{ block.description }}</p><a v-if="safeHref" :href="safeHref"
                    @click="editable && $event.preventDefault()">{{ safeHref }}</a>
            </div>
        </article>
        <div v-else-if="block.type === 'columns'" class="page-columns"
            :style="{ '--columns': block.columns?.length ?? 2 }">
            <div v-for="(column, index) in block.columns" :key="index" class="page-column">
                <PageBlockView v-for="child in column" :key="child.id" :block="child" :editable="editable"
                    :selected-id="selectedId" @select="emit('select', $event)"
                    @text="(id, value) => emit('text', id, value)" />
            </div>
        </div>
        <slot v-else-if="block.type === 'auth'" name="auth" />
        <slot v-else-if="['auth-field', 'auth-custom', 'auth-action'].includes(block.type)" name="auth-field"
            :block="block" />
    </div>
</template>

<style scoped>
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
    font-size: 2rem;
    line-height: 1.2;
    font-weight: 700;
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