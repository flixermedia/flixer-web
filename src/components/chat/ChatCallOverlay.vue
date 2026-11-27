<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { Button } from '@ui-sdk/vue/button'
import { onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { dismissCallNotice, listenForChatCalls, useChatCall } from '../../composables/useChatCall'

const props = defineProps<{ state?: ReturnType<typeof useChatCall> }>()
const { t } = useI18n()
const call = props.state ?? useChatCall()
const remoteVideo = ref<HTMLVideoElement | null>(null)
const remoteAudio = ref<HTMLAudioElement | null>(null)
const localVideo = ref<HTMLVideoElement | null>(null)
const minimized = ref(false)

onMounted(() => {
  if (!props.state) listenForChatCalls()
})

watch(call.phase, (next) => {
  if (next === 'idle' || next === 'ringing') minimized.value = false
})

watch([call.remoteStream, remoteVideo, remoteAudio, minimized], ([stream]) => {
  if (remoteVideo.value) remoteVideo.value.srcObject = stream
  if (remoteAudio.value) remoteAudio.value.srcObject = stream
}, { flush: 'post' })
watch([call.localStream, localVideo, minimized], ([stream]) => {
  if (localVideo.value) localVideo.value.srcObject = stream
}, { flush: 'post' })
</script>

<template>
  <div v-if="call.notice.value && call.phase.value === 'idle'" class="fixed bottom-4 left-1/2 z-[80] flex max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-3 rounded-xl border border-white/10 bg-flixer-surface px-4 py-3 text-sm text-white shadow-xl" role="status">
    <span>{{ t(`chat.call.notice.${call.notice.value}`) }}</span>
    <Button type="button" class="grid size-7 place-items-center rounded-lg border-0 bg-transparent p-0 text-white/70 hover:bg-white/10" :aria-label="t('chat.call.dismiss')" @click="dismissCallNotice">
      <Icon icon="lucide:x" class="size-4" aria-hidden="true" />
    </Button>
  </div>

  <template v-if="call.phase.value !== 'idle'">
    <audio ref="remoteAudio" autoplay />

    <div
      v-if="minimized"
      class="fixed right-4 top-20 z-[80] w-64 overflow-hidden rounded-xl border border-white/15 bg-flixer-surface/95 text-white shadow-2xl shadow-black/60 backdrop-blur"
      role="dialog"
      :aria-label="call.peerLabel.value"
    >
      <div v-if="call.video.value && call.remoteStream.value" class="relative aspect-video w-full bg-black">
        <video ref="remoteVideo" class="size-full object-cover" autoplay muted playsinline />
        <button
          type="button"
          class="absolute right-2 top-2 grid size-7 place-items-center rounded-lg bg-black/60 text-white transition hover:bg-black/80"
          :aria-label="t('chat.call.expand')"
          :title="t('chat.call.expand')"
          @click="minimized = false"
        >
          <Icon icon="lucide:maximize-2" class="size-3.5" aria-hidden="true" />
        </button>
      </div>
      <div class="flex items-center justify-between gap-2 px-3 py-2.5">
        <div class="flex min-w-0 items-center gap-2.5">
          <div class="grid size-8 shrink-0 place-items-center rounded-full bg-white/10 text-emerald-300">
            <Icon :icon="call.video.value ? 'lucide:video' : 'lucide:phone'" class="size-4" aria-hidden="true" />
          </div>
          <div class="min-w-0">
            <p class="truncate text-xs font-semibold text-white">{{ call.peerLabel.value }}</p>
            <p class="truncate text-[11px] text-white/70">
              <template v-if="call.phase.value === 'calling'">{{ t('chat.call.calling', { name: call.peerLabel.value }) }}</template>
              <template v-else-if="call.phase.value === 'connecting'">{{ t('chat.call.connecting') }}</template>
              <template v-else>{{ t('chat.call.connected') }}</template>
            </p>
          </div>
        </div>
        <div class="flex shrink-0 items-center gap-1">
          <button
            type="button"
            class="grid size-7 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
            :aria-label="t(call.micMuted.value ? 'chat.call.unmute' : 'chat.call.mute')"
            :title="t(call.micMuted.value ? 'chat.call.unmute' : 'chat.call.mute')"
            @click="call.toggleMic"
          >
            <Icon :icon="call.micMuted.value ? 'lucide:mic-off' : 'lucide:mic'" class="size-3.5" aria-hidden="true" />
          </button>
          <button
            v-if="!(call.video.value && call.remoteStream.value)"
            type="button"
            class="grid size-7 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
            :aria-label="t('chat.call.expand')"
            :title="t('chat.call.expand')"
            @click="minimized = false"
          >
            <Icon icon="lucide:maximize-2" class="size-3.5" aria-hidden="true" />
          </button>
          <button
            type="button"
            class="grid size-7 place-items-center rounded-full bg-red-600 text-white transition hover:bg-red-500"
            :aria-label="t('chat.call.hangUp')"
            :title="t('chat.call.hangUp')"
            @click="() => void call.hangUp()"
          >
            <Icon icon="lucide:phone-off" class="size-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>

    <div v-else class="fixed inset-0 z-[80] flex flex-col bg-black/90 text-white" role="dialog" aria-modal="true" :aria-label="call.peerLabel.value">
      <div class="relative flex min-h-0 flex-1 items-center justify-center">
        <video v-show="call.video.value && call.remoteStream.value" ref="remoteVideo" class="size-full object-contain" autoplay muted playsinline />
        <div v-if="!(call.video.value && call.remoteStream.value)" class="text-center">
          <div class="mx-auto mb-4 grid size-24 place-items-center rounded-full bg-white/10">
            <Icon :icon="call.video.value ? 'lucide:video' : 'lucide:phone'" class="size-10" aria-hidden="true" />
          </div>
          <p class="text-lg font-semibold">{{ call.peerLabel.value }}</p>
          <p class="mt-1 text-sm text-white/70">
            <template v-if="call.phase.value === 'ringing'">{{ t(call.video.value ? 'chat.call.incomingVideo' : 'chat.call.incomingAudio', { name: call.peerLabel.value }) }}</template>
            <template v-else-if="call.phase.value === 'calling'">{{ t('chat.call.calling', { name: call.peerLabel.value }) }}</template>
            <template v-else-if="call.phase.value === 'connecting'">{{ t('chat.call.connecting') }}</template>
          </p>
        </div>
        <video v-show="call.video.value && call.localStream.value" ref="localVideo" class="absolute bottom-4 right-4 h-32 w-24 rounded-lg border border-white/20 object-cover sm:h-40 sm:w-56" autoplay muted playsinline />
        <span class="absolute left-4 top-4 flex items-center gap-1 text-xs font-medium text-emerald-300">
          <Icon icon="lucide:lock-keyhole" class="size-3.5" aria-hidden="true" />
          {{ t('chat.call.e2ee') }}
        </span>
        <Button
          v-if="call.phase.value !== 'ringing'"
          type="button"
          class="absolute right-4 top-4 grid size-9 place-items-center rounded-lg border-0 bg-white/10 p-0 text-white hover:bg-white/20"
          :aria-label="t('chat.call.minimize')"
          :title="t('chat.call.minimize')"
          @click="minimized = true"
        >
          <Icon icon="lucide:minimize-2" class="size-4" aria-hidden="true" />
        </Button>
      </div>

      <div data-agent-hidden class="flex items-center justify-center gap-3 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <template v-if="call.phase.value === 'ringing'">
          <Button type="button" class="grid size-14 place-items-center rounded-full border-0 bg-red-600 p-0 text-white hover:bg-red-500" :aria-label="t('chat.call.decline')" @click="call.decline">
            <Icon icon="lucide:phone-off" class="size-6" aria-hidden="true" />
          </Button>
          <Button type="button" class="grid size-14 place-items-center rounded-full border-0 bg-emerald-600 p-0 text-white hover:bg-emerald-500" :aria-label="t('chat.call.accept')" @click="void call.accept()">
            <Icon :icon="call.video.value ? 'lucide:video' : 'lucide:phone'" class="size-6" aria-hidden="true" />
          </Button>
        </template>
        <template v-else>
          <Button type="button" class="grid size-12 place-items-center rounded-full border-0 bg-white/10 p-0 text-white hover:bg-white/20" :aria-label="t(call.micMuted.value ? 'chat.call.unmute' : 'chat.call.mute')" @click="call.toggleMic">
            <Icon :icon="call.micMuted.value ? 'lucide:mic-off' : 'lucide:mic'" class="size-5" aria-hidden="true" />
          </Button>
          <Button v-if="call.video.value" type="button" class="grid size-12 place-items-center rounded-full border-0 bg-white/10 p-0 text-white hover:bg-white/20" :aria-label="t(call.cameraOff.value ? 'chat.call.cameraOn' : 'chat.call.cameraOff')" @click="call.toggleCamera">
            <Icon :icon="call.cameraOff.value ? 'lucide:video-off' : 'lucide:video'" class="size-5" aria-hidden="true" />
          </Button>
          <Button type="button" class="grid size-14 place-items-center rounded-full border-0 bg-red-600 p-0 text-white hover:bg-red-500" :aria-label="t('chat.call.hangUp')" @click="() => void call.hangUp()">
            <Icon icon="lucide:phone-off" class="size-6" aria-hidden="true" />
          </Button>
        </template>
      </div>
    </div>
  </template>
</template>
