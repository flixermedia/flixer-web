<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import Skeleton from './Skeleton.vue'

/** Placeholder for a wrapped grid of artwork cards (browse, search, person pages). */
const { t } = useI18n()
withDefaults(defineProps<{ count?: number; square?: boolean }>(), { count: 12, square: false })
</script>

<template>
  <ul class="grid grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-x-4 gap-y-6 sm:grid-cols-[repeat(auto-fill,minmax(11rem,1fr))]" role="status" :aria-label="t('common.loading')" aria-busy="true">
    <li v-for="n in count" :key="n">
      <Skeleton :class="square ? 'aspect-square' : 'aspect-[2/3]'" class="w-full rounded-lg" />
      <Skeleton class="mt-2 h-3.5 w-3/4" />
      <Skeleton class="mt-1.5 h-3 w-1/3" />
    </li>
  </ul>
</template>
