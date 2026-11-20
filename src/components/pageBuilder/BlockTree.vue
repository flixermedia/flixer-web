<script setup lang="ts">
import Draggable from 'vuedraggable'
import { Icon } from '@iconify/vue'
import { useI18n } from 'vue-i18n'
import { Button } from '@ui-sdk/vue/button'
import type { PageBlock } from './pageBuilder'

const props = defineProps<{ blocks: PageBlock[]; selectedId: string; depth?: number }>()
const emit = defineEmits<{ select: [id: string]; remove: [id: string]; duplicate: [id: string] }>()
const { t } = useI18n()
const tool = 'grid size-8 shrink-0 place-items-center rounded text-flixer-muted hover:bg-white/10 hover:text-flixer-text focus-visible:outline-2 focus-visible:outline-flixer-accent disabled:opacity-30'

function depthOf(block: PageBlock): number {
    return block.columns ? 1 + Math.max(0, ...block.columns.flat().map(depthOf)) : 0
}
function allowMove(event: { to: HTMLElement; draggedContext: { element: PageBlock } }) {
    const targetDepth = Number(event.to.dataset.depth ?? 0)
    return !(['auth', 'auth-field', 'auth-custom', 'auth-action'].includes(event.draggedContext.element.type) && targetDepth > 0) && targetDepth + depthOf(event.draggedContext.element) <= 2
}
function move(index: number, direction: number) {
    const target = index + direction
    if (target < 0 || target >= props.blocks.length) return
    const block = props.blocks.splice(index, 1)[0]!
    props.blocks.splice(target, 0, block)
}
</script>

<template>
    <Draggable :list="blocks" item-key="id" group="page-blocks" handle=".block-drag" :move="allowMove"
        :data-depth="depth ?? 0" class="block-list" ghost-class="block-ghost" data-agent-hidden>
        <template #item="{ element: block, index }">
            <div class="block-entry">
                <div class="flex items-center rounded border border-flixer-border"
                    :class="selectedId === block.id ? 'bg-flixer-primary/15' : ''">
                    <span class="block-drag grid size-8 shrink-0 cursor-grab place-items-center text-flixer-muted"
                        aria-hidden="true">
                        <Icon icon="lucide:grip-vertical" class="size-4" />
                    </span>
                    <Button type="button" class="min-w-0 flex-1 truncate py-2 text-left text-sm"
                        @click="emit('select', block.id)">{{ block.type === 'auth-field' ?
                            t(`pageBuilder.authField.${block.field}`) : t(`pageBuilder.block.${block.type}`) }}</Button>
                    <Button type="button" :class="tool" :disabled="index === 0" :title="t('pageBuilder.moveUp')"
                        :aria-label="t('pageBuilder.moveUp')" @click="move(index, -1)">
                        <Icon icon="lucide:chevron-up" class="size-4" />
                    </Button>
                    <Button type="button" :class="tool" :disabled="index === blocks.length - 1"
                        :title="t('pageBuilder.moveDown')" :aria-label="t('pageBuilder.moveDown')"
                        @click="move(index, 1)">
                        <Icon icon="lucide:chevron-down" class="size-4" />
                    </Button>
                    <Button v-if="block.type !== 'auth' && block.type !== 'auth-field'" type="button" :class="tool"
                        :title="t('pageBuilder.duplicateBlock')" :aria-label="t('pageBuilder.duplicateBlock')"
                        @click="emit('duplicate', block.id)">
                        <Icon icon="lucide:copy" class="size-4" />
                    </Button>
                    <Button
                        v-if="block.type !== 'auth' && !(block.type === 'auth-field' && ['username', 'password', 'email', 'submit', 'switch'].includes(block.field ?? ''))"
                        type="button" :class="tool" :title="t('pageBuilder.removeBlock')"
                        :aria-label="t('pageBuilder.removeBlock')" @click="emit('remove', block.id)">
                        <Icon icon="lucide:trash-2" class="size-4" />
                    </Button>
                </div>
                <div v-if="block.columns" class="ml-4 grid gap-2 border-l border-flixer-border pl-2">
                    <div v-for="(column, columnIndex) in block.columns" :key="columnIndex"><span
                            class="text-xs text-flixer-muted">{{ t('pageBuilder.column', {
                                number: Number(columnIndex) +
                                    1
                            }) }}</span>
                        <BlockTree :blocks="column" :depth="(depth ?? 0) + 1" :selected-id="selectedId"
                            @select="emit('select', $event)" @remove="emit('remove', $event)"
                            @duplicate="emit('duplicate', $event)" />
                    </div>
                </div>
            </div>
        </template>
    </Draggable>
</template>

<style scoped>
@layer components.ui-sdk {
    [data-slot="button"],
    [data-slot="button"]:hover {
        all: revert-layer;
    }
}

.block-list {
    display: grid;
    gap: .25rem;
    min-height: 1.5rem;
}

.block-entry {
    min-width: 0;
}

.block-ghost {
    opacity: .35;
}
</style>