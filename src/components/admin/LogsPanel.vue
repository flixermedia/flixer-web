<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import AdminSection from './AdminSection.vue'
import { adminQuery } from './adminNav'

const { t } = useI18n()
const loggingPage = { path: '/admin', query: adminQuery('logging', 'logging') }
</script>

<template>
  <AdminSection :title="t('admin.logs.title')" :description="t('admin.logs.redirectDescription')">
    <template #actions>
      <RouterLink
        :to="loggingPage"
        class="rounded bg-white/10 px-4 py-1.5 text-xs font-semibold transition hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-flixer-accent"
      >
        {{ t('admin.logs.openLogging') }}
      </RouterLink>
    </template>
  </AdminSection>
</template>
