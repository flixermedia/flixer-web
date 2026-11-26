<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { getMailStatus } from '../../../api'
import AdminSection from '../AdminSection.vue'
import { useWidgetData } from './useWidgetData'

const { t } = useI18n()
const { data, failed } = useWidgetData(getMailStatus, 45_000)
</script>

<template>
  <AdminSection :title="t('admin.dashboard.widgets.mail')" compact class="h-full">
    <template #actions>
      <router-link :to="{ name: 'admin', query: { tab: 'mail' } }" class="text-xs font-medium text-flixer-accent hover:underline">
        {{ t('admin.dashboard.viewAll') }}
      </router-link>
    </template>

    <p v-if="failed && !data" class="text-sm text-red-200">{{ t('admin.dashboard.loadError') }}</p>
    <template v-else-if="data">
      <div class="flex flex-wrap gap-2 text-xs">
        <span class="rounded px-2 py-0.5 font-medium" :class="data.inbound.listening ? 'bg-emerald-500/20 text-emerald-200' : 'bg-white/10 text-flixer-muted'">
          {{ t('admin.dashboard.mailInbound', { state: data.inbound.listening ? t('admin.dashboard.online') : t('admin.dashboard.offline') }) }}
        </span>
        <span class="rounded px-2 py-0.5 font-medium" :class="data.outboundReady ? 'bg-emerald-500/20 text-emerald-200' : 'bg-white/10 text-flixer-muted'">
          {{ t('admin.dashboard.mailOutbound', { state: data.outboundReady ? t('admin.dashboard.ready') : t('admin.dashboard.notReady') }) }}
        </span>
      </div>
      <p class="mt-2 text-xs text-flixer-muted">
        {{ t('admin.dashboard.mailDomains', { verified: data.domains.verified, total: data.domains.total }) }}
      </p>
    </template>
    <p v-else class="text-sm text-flixer-muted">{{ t('common.loading') }}</p>
  </AdminSection>
</template>
