<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import Skeleton from '../ui/Skeleton.vue'

/** Placeholder for the home page: a few rows of cards. */
const { t } = useI18n()
withDefaults(defineProps<{ rows?: number }>(), { rows: 3 })
</script>

<template>
  <div class="space-y-8 pt-2" role="status" :aria-label="t('common.loading')" aria-busy="true">
    <section v-for="row in rows" :key="row" class="page-gutter">
      <Skeleton class="mb-3 h-5 w-40" />
      <div class="flex gap-3 overflow-hidden">
        <Skeleton v-for="n in 8" :key="n" class="aspect-[2/3] w-36 shrink-0 rounded-lg sm:w-44" />
      </div>
    </section>
  </div>
</template>
