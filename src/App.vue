<script setup lang="ts">
import { ModalOverlay, ModalTarget } from '@kolirt/vue-modal'
import OfflineBanner from './components/ui/OfflineBanner.vue'
</script>

<template>
  <RouterView />
  <OfflineBanner />

  <ModalTarget group="default" class="z-50">
    <ModalOverlay class="flixer-modal-overlay" />
  </ModalTarget>
</template>
