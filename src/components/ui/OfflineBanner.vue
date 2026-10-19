<script setup lang="ts">
import { useOnlineStatus } from '../../composables/useOnlineStatus'
import { useI18n } from 'vue-i18n'

const { isOnline } = useOnlineStatus()
const { t } = useI18n()
</script>

<template>
  <div v-if="!isOnline" role="status" class="fixed inset-x-0 bottom-0 z-60 flex items-center justify-center gap-2 border-t border-amber-400/30 bg-amber-950/95 px-4 py-3 text-center text-sm text-amber-100 backdrop-blur">
    <svg class="size-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
      <path d="M2 2l20 20M8.5 16.4a5 5 0 0 1 7 0M5 12.9a10 10 0 0 1 5.2-2.7M19 12.9a10 10 0 0 0-2.4-1.9M2 8.8a15 15 0 0 1 4.2-2.6M22 8.8A15 15 0 0 0 12 5.5M12 20h.01" />
    </svg>
    <span>{{ t('ui.offlineBanner') }}</span>
  </div>
</template>
