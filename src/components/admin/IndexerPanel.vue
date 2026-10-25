<script setup lang="ts">
import IndexerQueuesSection from './IndexerQueuesSection.vue'
import IndexerTasksSection from './IndexerTasksSection.vue'
import ThemeSongsSection from './ThemeSongsSection.vue'
</script>

<template>
  <div class="flex flex-col gap-6">
    <IndexerQueuesSection />
    <IndexerTasksSection />
    <ThemeSongsSection />
  </div>
</template>
