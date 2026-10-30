<script setup lang="ts">
import { useOnlineStatus } from '../../composables/useOnlineStatus'
import { useI18n } from 'vue-i18n'

const { isOnline } = useOnlineStatus()
const { t } = useI18n()
</script>

<template>
  <div v-if="!isOnline" role="status" class="fixed inset-x-0 bottom-0 z-60 flex items-center justify-center gap-2 border-t border-amber-400/30 bg-amber-950/95 px-4 py-3 text-center text-sm text-amber-100 backdrop-blur">
    <Icon icon="lucide:wifi-off" class="size-4 shrink-0" aria-hidden="true" />
    <span>{{ t('ui.offlineBanner') }}</span>
  </div>
</template>
