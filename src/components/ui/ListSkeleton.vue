<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import Skeleton from './Skeleton.vue'

/** Placeholder for a settings or admin panel's rows while its data loads. */
const { t } = useI18n()
withDefaults(defineProps<{ rows?: number }>(), { rows: 3 })
</script>

<template>
  <div class="space-y-3" role="status" :aria-label="t('common.loading')" aria-busy="true">
    <div v-for="n in rows" :key="n" class="flex items-center gap-3">
      <Skeleton class="size-9 shrink-0 rounded-full" />
      <div class="min-w-0 flex-1 space-y-2">
        <Skeleton class="h-3.5 w-2/5" />
        <Skeleton class="h-3 w-3/5" />
      </div>
    </div>
  </div>
</template>
