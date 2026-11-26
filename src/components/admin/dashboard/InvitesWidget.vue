<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { listInvitations } from '../../../api'
import AdminSection from '../AdminSection.vue'
import { useWidgetData } from './useWidgetData'

const { t } = useI18n()
const { data, failed } = useWidgetData(listInvitations, 60_000)

const summary = computed(() => {
  const list = data.value ?? []
  const active = list.filter((inv) => !inv.disabled && (!inv.expiresAt || new Date(inv.expiresAt).getTime() > Date.now()))
  const totalUses = list.reduce((sum, inv) => sum + inv.usedCount, 0)
  return { total: list.length, active: active.length, totalUses }
})
</script>

<template>
  <AdminSection :title="t('admin.dashboard.widgets.invites')" compact class="h-full">
    <template #actions>
      <router-link :to="{ name: 'admin', query: { tab: 'invites' } }" class="text-xs font-medium text-flixer-accent hover:underline">
        {{ t('admin.dashboard.viewAll') }}
      </router-link>
    </template>

    <p v-if="failed && !data" class="text-sm text-red-200">{{ t('admin.dashboard.loadError') }}</p>
    <template v-else-if="data">
      <p class="text-2xl font-semibold leading-8">
        {{ summary.active }} <span class="text-sm font-normal text-flixer-muted">{{ t('admin.dashboard.activeInvites') }}</span>
      </p>
      <p class="text-xs leading-4 text-flixer-muted">
        {{ t('admin.dashboard.inviteTotals', { total: summary.total, uses: summary.totalUses }) }}
      </p>
    </template>
    <p v-else class="text-sm text-flixer-muted">{{ t('common.loading') }}</p>
  </AdminSection>
</template>
