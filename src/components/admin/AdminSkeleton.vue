<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import Skeleton from '../ui/Skeleton.vue'

/**
 * Loading placeholders that copy the shape of what the admin panels show once loaded, so the page does not jump.
 * `cards` are bordered rows with a title and action buttons (libraries, shares, streams), `tasks` the compact rows,
 * `table` the users table, `stats` the overview, `fields` a form, `toggles` a list of switches, `tracks` small rows.
 */
withDefaults(defineProps<{ variant: 'cards' | 'tasks' | 'table' | 'stats' | 'fields' | 'toggles' | 'tracks'; rows?: number }>(), { rows: 2 })
const { t } = useI18n()
const rowClass = 'rounded-lg border border-flixer-border bg-flixer-background/60'
</script>

<template>
  <div role="status" :aria-label="t('common.loading')" aria-busy="true">
    <ul v-if="variant === 'cards'" class="flex flex-col gap-3">
      <li v-for="n in rows" :key="n" :class="[rowClass, 'p-4']">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div class="flex min-w-0 flex-1 items-center gap-2">
            <Skeleton class="h-4 w-40" />
            <Skeleton class="h-6 w-16 rounded" />
          </div>
          <div class="flex items-center gap-2">
            <Skeleton class="h-7 w-24 rounded" />
            <Skeleton class="h-7 w-20 rounded" />
            <Skeleton class="h-7 w-16 rounded" />
          </div>
        </div>
        <Skeleton class="mt-3 h-3 w-2/5" />
      </li>
    </ul>

    <ul v-else-if="variant === 'tasks'" class="flex flex-col gap-2">
      <li v-for="n in rows" :key="n" :class="[rowClass, 'p-3']">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div class="min-w-0 flex-1">
            <Skeleton class="h-3 w-3/5" />
            <Skeleton class="mt-2 h-3 w-1/3" />
          </div>
          <Skeleton class="h-6 w-14 rounded" />
        </div>
      </li>
    </ul>

    <div v-else-if="variant === 'table'" class="overflow-x-auto">
      <div class="flex gap-4 pb-2">
        <Skeleton v-for="n in 5" :key="n" class="h-3 flex-1" />
      </div>
      <div v-for="n in rows" :key="n" class="flex items-center gap-4 border-t border-flixer-border py-3">
        <div class="flex flex-1 items-center gap-3">
          <Skeleton class="size-8 shrink-0 rounded" />
          <div class="flex-1 space-y-2">
            <Skeleton class="h-3.5 w-28" />
            <Skeleton class="h-3 w-40" />
          </div>
        </div>
        <Skeleton class="h-6 w-16 flex-1 rounded" />
        <Skeleton class="h-6 w-16 flex-1 rounded" />
        <Skeleton class="h-3 flex-1" />
        <Skeleton class="h-3 flex-1" />
      </div>
    </div>

    <div v-else-if="variant === 'stats'" class="flex flex-col gap-6">
      <div class="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <div v-for="n in 5" :key="n" class="rounded-lg border border-flixer-border bg-flixer-surface/50 p-5">
          <Skeleton class="h-3 w-16" />
          <Skeleton class="mt-3 h-8 w-20" />
        </div>
      </div>
      <div class="grid gap-6 lg:grid-cols-3">
        <div v-for="n in 3" :key="n" class="rounded-lg border border-flixer-border bg-flixer-surface/50 p-5">
          <Skeleton class="h-5 w-1/2" />
          <Skeleton class="mt-2 h-3 w-4/5" />
          <div class="mt-5 space-y-3">
            <div v-for="m in 4" :key="m" class="flex justify-between gap-4">
              <Skeleton class="h-3 w-1/3" />
              <Skeleton class="h-3 w-1/4" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="variant === 'fields'" class="grid gap-4 md:grid-cols-3">
      <div v-for="n in rows" :key="n" class="space-y-2">
        <Skeleton class="h-3 w-24" />
        <Skeleton class="h-9 w-full" />
      </div>
    </div>

    <div v-else-if="variant === 'toggles'" class="flex flex-col gap-4">
      <div class="flex items-center justify-between gap-4 py-2">
        <div class="flex-1 space-y-2">
          <Skeleton class="h-4 w-1/3" />
          <Skeleton class="h-3 w-3/5" />
        </div>
        <Skeleton class="h-6 w-11 shrink-0 rounded-full" />
      </div>
      <div v-for="n in rows" :key="n" class="rounded border border-flixer-border p-3">
        <div class="flex items-center justify-between gap-4 py-2">
          <Skeleton class="h-4 w-1/3" />
          <Skeleton class="h-6 w-11 shrink-0 rounded-full" />
        </div>
        <Skeleton class="mt-1 h-3 w-24" />
        <Skeleton class="mt-2 h-9 w-full" />
      </div>
    </div>

    <ul v-else class="grid gap-1">
      <li v-for="n in rows" :key="n" class="flex items-center justify-between gap-3 rounded bg-white/5 px-3 py-1.5">
        <Skeleton class="h-3 w-3/5" />
        <Skeleton class="h-3 w-12 shrink-0" />
      </li>
    </ul>
  </div>
</template>
