<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Header from '../components/header/Header.vue'
import PasskeysSection from '../components/settings/PasskeysSection.vue'
import ProfileSection from '../components/settings/ProfileSection.vue'
import ServerSection from '../components/settings/ServerSection.vue'
import SettingsTabs, { type SettingsTab } from '../components/settings/SettingsTabs.vue'
import { useSignOut } from '../composables/useSignOut'

const route = useRoute()
const router = useRouter()
const { isSigningOut, signOut } = useSignOut()

const tabs = computed<SettingsTab[]>(() => {
  return [
    { id: 'profile', label: 'Profile' },
    { id: 'passkeys', label: 'Passkeys' },
  ]
})

const activeTab = computed({
  get: () => {
    const requested = typeof route.query.tab === 'string' ? route.query.tab : 'profile'
    return tabs.value.some((tab) => tab.id === requested) ? requested : 'profile'
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
      <h1 class="text-3xl font-semibold tracking-tight">Settings</h1>
      <p class="mt-2 text-sm text-flixer-muted">Manage your profile, passkeys and server preferences.</p>

      <nav class="mt-3" aria-label="Settings">
        <SettingsTabs v-model="activeTab" :tabs="tabs" class="w-fit max-w-full" />
      </nav>

      <div class="mt-8">
        <ProfileSection v-if="activeTab === 'profile'" />
        <PasskeysSection v-else-if="activeTab === 'passkeys'" />
        <ServerSection v-else-if="activeTab === 'server'" />
      </div>
    </main>
  </div>
</template>
