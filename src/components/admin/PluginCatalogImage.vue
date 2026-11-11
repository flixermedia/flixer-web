<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import { fetchPluginRepositoryImage } from '../../api'
import { limitedImageLoad } from '../../composables/imageQueue'

const props = defineProps<{ repositoryId: string; path: string; kind: 'icon' | 'banner' }>()
const src = ref('')
let abort: AbortController | undefined
let objectUrl = ''
let request = 0

function release() {
    if (objectUrl) URL.revokeObjectURL(objectUrl)
    objectUrl = ''
    src.value = ''
}

watch(() => [props.repositoryId, props.path], async () => {
    const current = ++request
    abort?.abort()
    release()
    abort = new AbortController()
    const signal = abort.signal
    try {
        const blob = await limitedImageLoad(() => fetchPluginRepositoryImage(props.repositoryId, props.path, signal), { signal })
        if (current !== request || signal.aborted) return
        objectUrl = URL.createObjectURL(blob)
        src.value = objectUrl
    } catch {
        if (current === request) release()
    }
}, { immediate: true })

onBeforeUnmount(() => {
    request++
    abort?.abort()
    release()
})
</script>

<template>
    <div class="flex items-center justify-center overflow-hidden bg-white/5">
        <img v-if="src" :src="src" alt="" class="h-full w-full"
            :class="kind === 'banner' ? 'object-cover' : 'object-contain'" @error="release" />
        <Icon v-else-if="kind === 'icon'" icon="lucide:puzzle" class="size-5 text-flixer-muted" aria-hidden="true" />
    </div>
</template>