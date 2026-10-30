<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { adminQuery } from '../adminNav'
import AdminSection from '../AdminSection.vue'

const { t } = useI18n()
const links = [
  { key: 'libraries', query: adminQuery('library', 'libraries') },
  { key: 'tasks', query: adminQuery('library', 'tasks') },
  { key: 'users', query: adminQuery('settings', 'users') },
  { key: 'requests', query: adminQuery('requests') },
  { key: 'updates', query: adminQuery('settings', 'updates') },
  { key: 'backups', query: adminQuery('settings', 'backups') },
] as const
</script>

<template>
  <AdminSection :title="t('admin.dashboard.widgets.shortcuts')" class="h-full">
    <div class="flex flex-wrap gap-2">
      <RouterLink v-for="link in links" :key="link.key" :to="{ path: '/admin', query: link.query }" class="rounded bg-white/10 px-4 py-2 text-sm font-medium transition hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-flixer-accent">{{ t(`admin.dashboard.shortcutNames.${link.key}`) }}</RouterLink>
    </div>
  </AdminSection>
</template>
