<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import DevicesPanel from '../components/admin/DevicesPanel.vue'
import GeneralPanel from '../components/admin/GeneralPanel.vue'
import LibrariesPanel from '../components/admin/LibrariesPanel.vue'
import LogsPanel from '../components/admin/LogsPanel.vue'
import OverviewPanel from '../components/admin/OverviewPanel.vue'
import StreamSessionsPanel from '../components/admin/StreamSessionsPanel.vue'
import TasksPanel from '../components/admin/TasksPanel.vue'
import TranscodingPanel from '../components/admin/TranscodingPanel.vue'
import UsersPanel from '../components/admin/UsersPanel.vue'
import Header from '../components/header/Header.vue'
import SettingsTabs, { type SettingsTab } from '../components/settings/SettingsTabs.vue'
import { useSignOut } from '../composables/useSignOut'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const { isSigningOut, signOut } = useSignOut()

const tabs = computed<SettingsTab[]>(() => ['overview', 'streams', 'libraries', 'users', 'devices', 'transcoding', 'tasks', 'logs', 'general'].map((id) => ({ id, label: t(`admin.tabs.${id}`) })))

const activeTab = computed({
  get: () => {
    const requested = typeof route.query.tab === 'string' ? route.query.tab : 'overview'
    return tabs.value.some((tab) => tab.id === requested) ? requested : 'overview'
  },
  set: (id: string) => {
    void router.replace({ query: { ...route.query, tab: id } })
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

      <div class="mt-8">
        <OverviewPanel v-if="activeTab === 'overview'" />
        <StreamSessionsPanel v-else-if="activeTab === 'streams'" />
        <LibrariesPanel v-else-if="activeTab === 'libraries'" />
        <UsersPanel v-else-if="activeTab === 'users'" />
        <DevicesPanel v-else-if="activeTab === 'devices'" />
        <TranscodingPanel v-else-if="activeTab === 'transcoding'" />
        <TasksPanel v-else-if="activeTab === 'tasks'" />
        <LogsPanel v-else-if="activeTab === 'logs'" />
        <GeneralPanel v-else-if="activeTab === 'general'" />
      </div>
    </main>
  </div>
</template>
