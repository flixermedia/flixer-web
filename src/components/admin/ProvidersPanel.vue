<script setup lang="ts">
import IndexerProvidersSection from './IndexerProvidersSection.vue'
import IndexerSubtitlesSection from './IndexerSubtitlesSection.vue'
import SkipMeSection from './SkipMeSection.vue'
</script>

<template>
  <div class="flex flex-col gap-6">
    <IndexerProvidersSection />
    <SkipMeSection />
    <IndexerSubtitlesSection />
  </div>
</template>
