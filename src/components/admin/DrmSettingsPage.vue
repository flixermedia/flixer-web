<script setup lang="ts">
import { ref } from 'vue'
import WidevineSettingsSection from './WidevineSettingsSection.vue'
import DrmTestingPanel from './DrmTestingPanel.vue'

const revision = ref(0)
</script>

<template>
  <div class="flex flex-col gap-10">
    <WidevineSettingsSection @saved="revision++" />
    <DrmTestingPanel :key="revision" />
  </div>
</template>
