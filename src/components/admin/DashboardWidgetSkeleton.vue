<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { DashboardWidgetId } from './dashboard/dashboardCatalog'
import Skeleton from '../ui/Skeleton.vue'

const props = defineProps<{ widget: DashboardWidgetId }>()
const { t } = useI18n()
const title = computed(() => t(`admin.dashboard.widgets.${props.widget}`))
const compact = computed(() => ['services', 'updates', 'requests'].includes(props.widget))
const headerWidth = computed(() => (props.widget === 'shortcuts' ? 'w-28' : 'w-36'))
</script>

<template>
  <div role="status" :aria-label="t('common.loading')" aria-busy="true" class="h-full">
    <div v-if="widget === 'stats'" class="grid h-full grid-cols-2 gap-3 lg:grid-cols-5">
      <div v-for="n in 5" :key="n" class="admin-card min-w-0 p-3">
        <Skeleton class="h-3 w-16 max-w-full" />
        <Skeleton class="mt-3 h-7 w-20 max-w-full" />
      </div>
    </div>

    <section v-else class="admin-card h-full overflow-hidden" :class="compact ? 'p-3' : 'p-5'">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div class="min-w-0 flex-1">
          <h2 class="truncate font-semibold tracking-tight" :class="compact ? 'text-sm' : 'text-base'">
            <span class="sr-only">{{ title }}</span>
            <Skeleton :class="headerWidth" class="h-4 max-w-full" />
          </h2>
          <Skeleton v-if="['server', 'storage', 'activity'].includes(widget)" class="mt-2 h-3 w-4/5 max-w-full" />
        </div>
        <div v-if="widget === 'server'" class="flex gap-2">
          <Skeleton class="h-5 w-16 rounded-full" />
          <Skeleton class="h-5 w-16 rounded-full" />
        </div>
      </div>

      <div :class="compact ? 'mt-2' : 'mt-4'">
        <dl v-if="widget === 'server'" class="grid gap-y-2">
          <div v-for="n in 7" :key="n" class="flex justify-between gap-4">
            <Skeleton class="h-3 w-2/5" />
            <Skeleton class="h-3 w-1/3" />
          </div>
        </dl>

        <template v-else-if="widget === 'storage'">
          <Skeleton class="h-7 w-32 max-w-full" />
          <Skeleton class="mt-3 h-2 w-full rounded-full" />
          <div class="mt-4 grid gap-2">
            <div v-for="n in 3" :key="n" class="flex justify-between gap-4">
              <Skeleton class="h-3 w-2/5" />
              <Skeleton class="h-3 w-1/4" />
            </div>
          </div>
        </template>

        <ul v-else-if="widget === 'activity'" class="grid gap-3">
          <li v-for="n in 3" :key="n" class="space-y-2">
            <Skeleton class="h-3 w-4/5 max-w-full" />
            <Skeleton class="h-3 w-1/3" />
          </li>
          <Skeleton class="mt-1 h-3 w-24" />
        </ul>

        <template v-else-if="widget === 'uptime'">
          <Skeleton class="h-9 w-32 max-w-full" />
          <Skeleton class="mt-2 h-3 w-3/4 max-w-full" />
        </template>

        <template v-else-if="widget === 'transcoding'">
          <Skeleton class="h-9 w-20" />
          <Skeleton class="mt-3 h-2 w-full rounded-full" />
          <Skeleton class="mt-2 h-3 w-28 max-w-full" />
        </template>

        <ul v-else-if="widget === 'libraries'" class="grid gap-3">
          <li v-for="n in 4" :key="n" class="flex justify-between gap-3">
            <Skeleton class="h-3 w-2/5" />
            <Skeleton class="h-3 w-1/3" />
          </li>
        </ul>

        <ul v-else-if="widget === 'content-mix'" class="grid gap-3">
          <li v-for="n in 5" :key="n">
            <div class="flex justify-between gap-4">
              <Skeleton class="h-3 w-1/3" />
              <Skeleton class="h-3 w-10" />
            </div>
            <Skeleton class="mt-2 h-2 w-full rounded-full" />
          </li>
        </ul>

        <ul v-else-if="widget === 'services'" class="flex flex-wrap gap-x-4 gap-y-2">
          <li v-for="n in 2" :key="n" class="flex items-center gap-2">
            <Skeleton class="h-3 w-14" />
            <Skeleton class="h-5 w-16 rounded-full" />
          </li>
        </ul>

        <dl v-else-if="widget === 'queues' || widget === 'users'" class="grid grid-cols-2 gap-3">
          <div v-for="n in 4" :key="n" class="space-y-2">
            <Skeleton class="h-3 w-16 max-w-full" />
            <Skeleton class="h-7 w-10" />
          </div>
        </dl>

        <template v-else-if="widget === 'updates'">
          <Skeleton class="h-5 w-28 max-w-full rounded-full" />
          <Skeleton class="mt-2 h-3 w-4/5 max-w-full" />
        </template>

        <dl v-else-if="widget === 'backups'" class="grid gap-3">
          <div v-for="n in 3" :key="n" class="flex justify-between gap-3">
            <Skeleton class="h-3 w-2/5" />
            <Skeleton class="h-3 w-1/3" />
          </div>
        </dl>

        <template v-else-if="widget === 'requests'">
          <Skeleton class="h-8 w-24" />
          <Skeleton class="mt-2 h-3 w-4/5 max-w-full" />
        </template>

        <div v-else-if="widget === 'shortcuts'" class="flex flex-wrap gap-2">
          <Skeleton v-for="n in 6" :key="n" class="h-9 w-24 rounded" />
        </div>

        <ul v-else-if="widget === 'streams'" class="grid gap-3">
          <li v-for="n in 3" :key="n" class="rounded border border-flixer-border bg-flixer-background/60 p-3">
            <div class="flex items-center justify-between gap-3">
              <Skeleton class="h-4 w-2/5" />
              <Skeleton class="h-6 w-16 rounded" />
            </div>
            <Skeleton class="mt-3 h-3 w-3/4 max-w-full" />
            <Skeleton class="mt-3 h-2 w-full rounded-full" />
          </li>
        </ul>

        <div v-else-if="widget === 'logs'" class="space-y-3">
          <div class="flex gap-3">
            <Skeleton v-for="n in 4" :key="n" class="h-7 flex-1 rounded" />
          </div>
          <div v-for="n in 5" :key="n" class="flex items-center gap-3 border-t border-flixer-border py-2">
            <Skeleton class="h-3 w-16 shrink-0" />
            <Skeleton class="h-3 w-14 shrink-0 rounded" />
            <Skeleton class="h-3 flex-1" />
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
