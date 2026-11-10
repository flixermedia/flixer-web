<script setup lang="ts">
import { ref } from 'vue'
import { ModalContent, ModalRoot, ModalTitle, useModalContext } from '@kolirt/vue-modal'
import { useI18n } from 'vue-i18n'
import type { ItemTrailer, StreamInfo } from '../../api'
import VideoPlayer from '../player/VideoPlayer.vue'

defineOptions({ modalGroup: 'default' })

defineProps<{ trailer: ItemTrailer }>()
const { close } = useModalContext()
const { t } = useI18n()
const cropAspect = ref<number | null>(null)
const info: StreamInfo = {
  playMethod: 'DirectPlay',
  source: { videoCodec: 'h264', audioCodec: 'aac', width: 0, height: 0, durationSeconds: 0 },
  availableHeights: [],
}
</script>

<template>
  <ModalRoot class="flex items-center justify-center p-4">
    <ModalContent class="flixer-modal-card w-full max-w-4xl overflow-y-auto rounded border border-flixer-border bg-flixer-surface p-6 text-flixer-text shadow-2xl shadow-black/60">
      <header class="flixer-modal-header flex items-center justify-between gap-4">
        <ModalTitle class="text-lg font-semibold">{{ trailer.name }}</ModalTitle>
        <button type="button" class="rounded border border-flixer-border px-4 py-2 text-sm font-semibold hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent" @click="close()">{{ t('common.close') }}</button>
      </header>
      <div class="pt-6">
        <div v-if="trailer.streamUrl" class="aspect-video w-full bg-black" :style="cropAspect ? { aspectRatio: String(cropAspect) } : undefined">
          <VideoPlayer :stream-url="trailer.streamUrl" :info="info" :title="trailer.name" :autoplay="false" crop-category="trailers" standalone @crop-aspect-change="cropAspect = $event" />
        </div>
        <template v-else-if="trailer.key">
          <iframe class="aspect-video w-full" :src="`https://www.youtube-nocookie.com/embed/${trailer.key}`" :title="trailer.name" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>
          <a class="mt-3 inline-block text-sm text-flixer-muted underline hover:text-white" :href="`https://www.youtube.com/watch?v=${trailer.key}`" target="_blank" rel="noopener noreferrer">{{ t('mediaItem.trailerOnYoutube') }}</a>
        </template>
        <p v-else role="alert">{{ t('mediaItem.trailerUnavailable') }}</p>
      </div>
    </ModalContent>
  </ModalRoot>
</template>
