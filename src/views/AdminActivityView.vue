<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import ActivityPanel from '../components/admin/ActivityPanel.vue'
import { ADMIN_GROUPS, type AdminGroupId } from '../components/admin/adminNav'
import Header from '../components/header/Header.vue'
import SettingsTabs, { type SettingsTab } from '../components/settings/SettingsTabs.vue'
import { useSignOut } from '../composables/useSignOut'

const router = useRouter()
const { t } = useI18n()
const { isSigningOut, signOut } = useSignOut()

const tabs = computed<SettingsTab[]>(() => (Object.keys(ADMIN_GROUPS) as AdminGroupId[]).map((id) => ({ id, label: t(`admin.groups.${id}`) })))
const activeTab = computed({
  get: () => 'dashboard',
  set: (id: string) => void router.push({ name: 'admin', query: { tab: id } }),
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
        <ActivityPanel />
      </div>
    </main>
  </div>
</template>
