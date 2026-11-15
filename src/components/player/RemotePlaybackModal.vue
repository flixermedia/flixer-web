<script setup lang="ts">
import { computed } from 'vue'
import { openModal } from '@kolirt/vue-modal'
import { ModalContent, ModalDescription, ModalRoot, ModalTitle, useModalContext } from '@kolirt/vue-modal'
import { useI18n } from 'vue-i18n'
import { useRemotePlayback, type RemoteCastItem, type RemotePlaybackDevice } from '../../composables/useRemotePlayback'
import { notify } from '../../composables/notify'
import RemotePlaybackControlModal from './RemotePlaybackControlModal.vue'

defineOptions({ modalGroup: 'default' })
const props = defineProps<{ cast?: RemoteCastItem }>()
const { close } = useModalContext<void>()
const { t } = useI18n()
const remote = useRemotePlayback()
const devices = computed(() => remote.otherDevices.value.filter((device) => props.cast || device.player))
const connected = computed(() => remote.status.value === 'connected')

function control(device: RemotePlaybackDevice) {
  if (props.cast && !remote.sendCommand(device.clientId, { action: 'play-item', item: props.cast })) {
    notify.error(t('remotePlayback.castFailed'))
    return
  }
  close()
  setTimeout(() => void openModal<void>(RemotePlaybackControlModal, { props: { clientId: device.clientId } }).catch(() => undefined), 220)
}
</script>

<template>
  <ModalRoot class="flex items-center justify-center p-4">
    <ModalContent class="flixer-modal-card flex max-h-[calc(100dvh-2rem)] w-full max-w-lg flex-col overflow-y-auto rounded border border-flixer-border bg-flixer-surface p-6 text-flixer-text shadow-2xl shadow-black/60">
      <header class="flixer-modal-header">
        <ModalTitle class="text-lg font-semibold text-white">{{ t(props.cast ? 'remotePlayback.castTitle' : 'remotePlayback.title') }}</ModalTitle>
        <ModalDescription class="mt-1 text-sm leading-6 text-flixer-muted">{{ t(props.cast ? 'remotePlayback.castDescription' : 'remotePlayback.description') }}</ModalDescription>
      </header>
      <div class="mt-5 min-h-0 flex-1 space-y-3 overflow-y-auto">
        <p v-if="!connected" class="text-sm text-flixer-muted" role="status">{{ t('remotePlayback.connecting') }}</p>
        <p v-else-if="!devices.length" class="text-sm text-flixer-muted">{{ t(props.cast ? 'remotePlayback.castNoDevices' : 'remotePlayback.noDevices') }}</p>
        <button v-for="device in devices" :key="device.clientId" type="button" class="flex w-full items-center gap-3 border-b border-flixer-border py-3 text-left last:border-0 hover:bg-white/5" @click="control(device)">
          <Icon :icon="device.player?.kind === 'video' ? 'lucide:monitor-play' : device.player?.kind === 'audio' ? 'lucide:audio-lines' : 'lucide:monitor'" class="size-5 shrink-0 text-flixer-muted" aria-hidden="true" />
          <span class="min-w-0 flex-1">
            <span class="block truncate text-sm font-semibold text-white">{{ device.deviceName }}</span>
            <span v-if="device.player" class="mt-1 block truncate text-sm">{{ device.player.title }}</span>
            <span v-if="device.player?.subtitle" class="block truncate text-xs text-flixer-muted">{{ device.player.subtitle }}</span>
            <span v-else-if="!device.player && props.cast" class="mt-1 block truncate text-sm text-flixer-muted">{{ t('remotePlayback.readyToCast') }}</span>
          </span>
          <Icon icon="lucide:chevron-right" class="size-4 shrink-0 text-flixer-muted" aria-hidden="true" />
        </button>
      </div>
      <div class="flixer-modal-actions mt-5 flex shrink-0 justify-end">
        <button type="button" class="flex h-11 items-center justify-center rounded border border-flixer-border px-6 text-sm font-semibold hover:bg-white/5" @click="close()">{{ t('common.close') }}</button>
      </div>
    </ModalContent>
  </ModalRoot>
</template>
