<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { tasks } from './mock'
import AdminSection from './AdminSection.vue'
import StatusPill from './StatusPill.vue'

const { t } = useI18n()
const resultTone = { Completed: 'good', Failed: 'bad', 'Never run': 'neutral' } as const
const resultKeys = { Completed: 'admin.tasks.completed', Failed: 'admin.tasks.failed', 'Never run': 'admin.tasks.neverRun' }
const categoryKeys: Record<string, string> = { Library: 'admin.tasks.libraryCategory', Maintenance: 'admin.tasks.maintenanceCategory' }
</script>

<template>
  <AdminSection :title="t('admin.tasks.title')" :description="t('admin.tasks.description')">
    <ul class="flex flex-col gap-3">
      <li v-for="task in tasks" :key="task.id" class="rounded-lg border border-flixer-border bg-flixer-background/60 p-4">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="text-sm font-semibold">
              {{ task.name }} <StatusPill tone="accent" class="ml-2">{{ t(categoryKeys[task.category]) }}</StatusPill>
            </p>
            <p class="mt-1 text-xs text-flixer-muted">{{ task.description }}</p>
          </div>
          <div class="flex items-center gap-2">
            <StatusPill v-if="task.running" tone="good">{{ t('admin.tasks.running', { progress: task.progress }) }}</StatusPill>
            <StatusPill v-else :tone="resultTone[task.lastResult]">{{ t(resultKeys[task.lastResult]) }}</StatusPill>
            <button v-if="task.running" type="button" class="rounded bg-red-500/20 px-4 py-1.5 text-xs font-semibold text-red-200 transition hover:bg-red-500/30">{{ t('admin.tasks.stop') }}</button>
            <button v-else type="button" class="rounded bg-white/10 px-4 py-1.5 text-xs font-semibold transition hover:bg-white/15">{{ t('admin.tasks.runNow') }}</button>
          </div>
        </div>
        <div v-if="task.running" class="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div class="h-full rounded-full bg-flixer-primary" :style="{ width: `${task.progress}%` }"></div>
        </div>
        <p class="mt-3 text-xs text-flixer-muted">
          {{ t('admin.tasks.trigger') }}: <span class="font-medium text-flixer-text">{{ task.trigger }}</span> · {{ t('admin.tasks.lastRun') }}: <span class="font-medium text-flixer-text">{{ task.lastRun }}</span>
        </p>
      </li>
    </ul>
  </AdminSection>
</template>
