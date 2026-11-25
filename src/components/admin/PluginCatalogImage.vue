<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { fetchPluginRepositoryImage } from '../../api'
import { limitedImageLoad } from '../../composables/imageQueue'
import { isValidBlurhash } from '../../composables/blurhash'
import BlurhashCanvas from '../ui/BlurhashCanvas.vue'

const props = defineProps<{ repositoryId: string; path: string; kind: 'icon' | 'banner'; blurhash?: string | null }>()
const hasBlurhash = computed(() => isValidBlurhash(props.blurhash))
const src = ref('')
const loaded = ref(false)
let abort: AbortController | undefined
let objectUrl = ''
let request = 0

function release() {
    if (objectUrl) URL.revokeObjectURL(objectUrl)
    objectUrl = ''
    src.value = ''
    loaded.value = false
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
    <div class="relative flex items-center justify-center overflow-hidden bg-white/5">
        <BlurhashCanvas
            v-if="hasBlurhash"
            :hash="blurhash!"
            class="absolute inset-0 size-full transition-opacity duration-500 motion-reduce:transition-none"
            :class="src && loaded ? 'opacity-0' : 'opacity-100'"
        />
        <img v-if="src" :src="src" alt="" class="relative h-full w-full transition-opacity duration-500 motion-reduce:transition-none"
            :class="[kind === 'banner' ? 'object-cover' : 'object-contain', loaded ? 'opacity-100' : 'opacity-0']" @load="loaded = true" @error="release" />
        <Icon v-else-if="kind === 'icon' && !hasBlurhash" icon="lucide:puzzle" class="size-5 text-flixer-muted" aria-hidden="true" />
    </div>
</template>