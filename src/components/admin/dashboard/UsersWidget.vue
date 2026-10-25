<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { listAdminUsers } from '../../../api'
import AdminSection from '../AdminSection.vue'
import { useWidgetData } from './useWidgetData'

const { t } = useI18n()
const { data, failed } = useWidgetData(listAdminUsers, 30000)
const summary = computed(() => {
  const users = data.value ?? []
  return { total: users.length, admins: users.filter((u) => u.role === 'admin').length, signedIn: users.filter((u) => u.activeSessions > 0).length, disabled: users.filter((u) => u.disabled).length }
})
</script>

<template>
  <AdminSection :title="t('admin.dashboard.widgets.users')" class="h-full">
    <p v-if="failed && !data" class="text-sm text-red-200">{{ t('admin.dashboard.loadError') }}</p>
    <dl v-else-if="data" class="grid grid-cols-2 gap-3 text-sm">
      <div v-for="key in ['total', 'admins', 'signedIn', 'disabled'] as const" :key="key">
        <dt class="text-xs text-flixer-muted">{{ t(`admin.dashboard.userStats.${key}`) }}</dt>
        <dd class="text-2xl font-semibold">{{ summary[key] }}</dd>
      </div>
    </dl>
    <p v-else class="text-sm text-flixer-muted">{{ t('common.loading') }}</p>
  </AdminSection>
</template>
