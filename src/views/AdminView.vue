<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import DevicesPanel from '../components/admin/DevicesPanel.vue'
import GeneralPanel from '../components/admin/GeneralPanel.vue'
import LibrariesPanel from '../components/admin/LibrariesPanel.vue'
import IndexerPanel from '../components/admin/IndexerPanel.vue'
import ProvidersPanel from '../components/admin/ProvidersPanel.vue'
import MediaPanel from '../components/admin/MediaPanel.vue'
import LogsPanel from '../components/admin/LogsPanel.vue'
import OverviewPanel from '../components/admin/OverviewPanel.vue'
import StreamSessionsPanel from '../components/admin/StreamSessionsPanel.vue'
import TasksPanel from '../components/admin/TasksPanel.vue'
import TranscodingPanel from '../components/admin/TranscodingPanel.vue'
import UsersPanel from '../components/admin/UsersPanel.vue'
import Header from '../components/header/Header.vue'
import SettingsTabs, { type SettingsTab } from '../components/settings/SettingsTabs.vue'
import { useSignOut } from '../composables/useSignOut'
import { ADMIN_GROUPS, resolveAdminGroup, type AdminGroupId } from '../components/admin/adminNav'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const { isSigningOut, signOut } = useSignOut()

const tabs = computed<SettingsTab[]>(() => (Object.keys(ADMIN_GROUPS) as AdminGroupId[]).map((id) => ({ id, label: t(`admin.groups.${id}`) })))
const activeTab = computed({
  get: () => resolveAdminGroup(route.query.tab),
  set: (id: string) => {
    const query = Object.fromEntries(Object.entries(route.query).filter(([key]) => !key.startsWith('m')))
    void router.replace({ query: { ...query, tab: id } })
  },
})
</script>

<template>
  <div class="min-h-screen overflow-x-hidden bg-flixer-background font-sans text-flixer-text">
    <Header :links="[]" :is-signing-out="isSigningOut" @logout="signOut" />

    <main class="page-gutter w-full pb-16 pt-28">
      <h1 class="text-3xl font-semibold tracking-tight">{{ t('admin.title') }}</h1>
      <p class="mt-2 text-sm text-flixer-muted">{{ t('admin.subtitle') }}</p>

      <nav class="mt-3" :aria-label="t('admin.adminNavigation')">
        <SettingsTabs v-model="activeTab" :tabs="tabs" class="w-fit max-w-full" />
      </nav>

      <div class="mt-8 flex flex-col gap-10">
        <template v-if="activeTab === 'dashboard'">
          <OverviewPanel />
          <StreamSessionsPanel />
          <LogsPanel />
        </template>
        <template v-else-if="activeTab === 'library'">
          <LibrariesPanel />
          <IndexerPanel />
        </template>
        <MediaPanel v-else-if="activeTab === 'media'" />
        <ProvidersPanel v-else-if="activeTab === 'providers'" />
        <TranscodingPanel v-else-if="activeTab === 'transcoding'" />
        <DevicesPanel v-else-if="activeTab === 'apikeys'" part="keys" />
        <template v-else-if="activeTab === 'users'">
          <UsersPanel />
          <DevicesPanel part="devices" />
        </template>
        <template v-else>
          <GeneralPanel />
          <TasksPanel />
        </template>
      </div>
    </main>
  </div>
</template>
