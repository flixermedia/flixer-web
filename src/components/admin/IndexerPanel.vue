<script setup lang="ts">
import IndexerProvidersSection from './IndexerProvidersSection.vue'
import IndexerSubtitlesSection from './IndexerSubtitlesSection.vue'
import IndexerQueuesSection from './IndexerQueuesSection.vue'
import IndexerTasksSection from './IndexerTasksSection.vue'
</script>

<template>
  <div class="flex flex-col gap-6">
    <IndexerQueuesSection />
    <IndexerTasksSection />
    <IndexerProvidersSection />
    <IndexerSubtitlesSection />
  </div>
</template>
