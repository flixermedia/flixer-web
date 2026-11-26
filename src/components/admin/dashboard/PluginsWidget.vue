<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { listPluginInstallations } from '../../../api'
import AdminSection from '../AdminSection.vue'
import { useWidgetData } from './useWidgetData'

const { t } = useI18n()
const { data, failed } = useWidgetData(listPluginInstallations, 60_000)

const summary = computed(() => {
  const list = data.value ?? []
  return {
    total: list.length,
    enabled: list.filter((plugin) => plugin.enabled).length,
    updates: list.filter((plugin) => Boolean(plugin.availableUpdate)).length,
  }
})
</script>

<template>
  <AdminSection :title="t('admin.dashboard.widgets.plugins')" compact class="h-full">
    <template #actions>
      <router-link :to="{ name: 'admin', query: { tab: 'plugins' } }" class="text-xs font-medium text-flixer-accent hover:underline">
        {{ t('admin.dashboard.viewAll') }}
      </router-link>
    </template>

    <p v-if="failed && !data" class="text-sm text-red-200">{{ t('admin.dashboard.loadError') }}</p>
    <template v-else-if="data">
      <p class="text-2xl font-semibold leading-8">
        {{ summary.enabled }} <span class="text-sm font-normal text-flixer-muted">/ {{ summary.total }} {{ t('admin.dashboard.activeLabel') }}</span>
      </p>
      <p class="text-xs leading-4 text-flixer-muted">
        {{ summary.updates > 0 ? t('admin.dashboard.pluginUpdatesAvailable', { count: summary.updates }) : t('admin.dashboard.pluginsUpToDate') }}
      </p>
    </template>
    <p v-else class="text-sm text-flixer-muted">{{ t('common.loading') }}</p>
  </AdminSection>
</template>
