<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { listAdminScheduledTasks, runAdminScheduledTask } from '../../../api'
import { notify } from '../../../composables/notify'
import { describeRequestError } from '../../../composables/useProfile'
import { catchError } from '../../../utils/catchError'
import AdminSection from '../AdminSection.vue'
import { useWidgetData } from './useWidgetData'

const { t } = useI18n()
const { data, failed, refresh } = useWidgetData(listAdminScheduledTasks, 20_000)
const runningId = ref<string | null>(null)

const summary = computed(() => {
  const tasks = data.value ?? []
  return {
    total: tasks.length,
    enabled: tasks.filter((task) => task.enabled).length,
    running: tasks.filter((task) => task.state === 'running').length,
    failed: tasks.filter((task) => task.state === 'failed' || Boolean(task.lastError)).length,
  }
})

const featured = computed(() =>
  [...(data.value ?? [])]
    .sort((a, b) => Number(b.state === 'running') - Number(a.state === 'running') || Number(b.enabled) - Number(a.enabled))
    .slice(0, 4),
)

async function triggerTask(id: string) {
  if (runningId.value) return
  runningId.value = id
  const [error] = await catchError(runAdminScheduledTask(id))
  runningId.value = null
  if (error) {
    notify.error(describeRequestError(error, t('errors.generic')))
    return
  }
  notify.success(t('admin.dashboard.taskQueued'))
  void refresh()
}
</script>

<template>
  <AdminSection :title="t('admin.dashboard.widgets.tasks')" compact class="h-full">
    <template #actions>
      <router-link :to="{ name: 'admin', query: { tab: 'library', page: 'tasks' } }" class="text-xs font-medium text-flixer-accent hover:underline">
        {{ t('admin.dashboard.viewAll') }}
      </router-link>
    </template>

    <p v-if="failed && !data" class="text-sm text-red-200">{{ t('admin.dashboard.loadError') }}</p>
    <template v-else-if="data">
      <div class="flex flex-wrap items-baseline justify-between gap-2">
        <p class="text-2xl font-semibold leading-8">
          {{ summary.enabled }} <span class="text-sm font-normal text-flixer-muted">/ {{ summary.total }} {{ t('admin.dashboard.enabledLabel') }}</span>
        </p>
        <span v-if="summary.failed > 0" class="rounded bg-red-500/20 px-2 py-0.5 text-[11px] font-medium text-red-200">
          {{ summary.failed }} {{ t('admin.dashboard.failedLabel') }}
        </span>
      </div>
      <ul class="mt-3 space-y-1.5">
        <li v-for="task in featured" :key="task.id" class="flex items-center justify-between gap-2 text-xs">
          <span class="min-w-0 truncate">{{ task.name }}</span>
          <button
            type="button"
            class="shrink-0 rounded bg-white/10 px-2 py-0.5 text-[11px] font-medium transition hover:bg-flixer-primary hover:text-white disabled:opacity-40"
            :disabled="task.state === 'running' || runningId === task.id"
            @click="triggerTask(task.id)"
          >
            {{ task.state === 'running' ? t('admin.dashboard.running') : t('admin.dashboard.runNow') }}
          </button>
        </li>
      </ul>
    </template>
    <p v-else class="text-sm text-flixer-muted">{{ t('common.loading') }}</p>
  </AdminSection>
</template>
