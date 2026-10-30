<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import Header from '../components/header/Header.vue'
import DefaultPlaybackOptionsSection from '../components/settings/DefaultPlaybackOptionsSection.vue'
import LanguageSection from '../components/settings/LanguageSection.vue'
import PasskeysSection from '../components/settings/PasskeysSection.vue'
import ProfileSection from '../components/settings/ProfileSection.vue'
import ServerSection from '../components/settings/ServerSection.vue'
import type { SettingsTab } from '../components/settings/SettingsTabs.vue'
import { useSignOut } from '../composables/useSignOut'
import { isNativeApp } from '../platform/serverConnection'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const { isSigningOut, signOut } = useSignOut()

const tabIcons: Record<string, string> = {
  profile: 'lucide:user-round',
  passkeys: 'lucide:fingerprint',
  language: 'lucide:languages',
  defaultPlayback: 'lucide:play',
}

const tabs = computed<SettingsTab[]>(() => {
  return [{ id: 'profile', label: t('settings.tabs.profile') }, ...(!isNativeApp() ? [{ id: 'passkeys' as const, label: t('settings.tabs.passkeys') }] : []), { id: 'language', label: t('settings.tabs.language') }, { id: 'defaultPlayback', label: t('settings.tabs.defaultPlayback') }]
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

function selectTab(id: string) {
  activeTab.value = id
}
</script>

<template>
  <div class="min-h-screen overflow-x-hidden bg-flixer-background font-sans text-flixer-text">
    <Header :docked="true" :links="[]" :is-signing-out="isSigningOut" @logout="signOut" />

    <main class="page-gutter mx-auto w-full max-w-[110rem] pb-16 pt-24 lg:pt-28">
      <header class="admin-card mb-6 flex flex-wrap items-center justify-between gap-5 p-5 sm:p-6">
        <div class="flex min-w-0 items-center gap-4">
          <span class="grid size-12 shrink-0 place-items-center rounded-lg border border-flixer-accent/25 bg-flixer-primary/20 text-flixer-accent shadow-inner shadow-white/5">
            <Icon icon="lucide:settings-2" class="size-6" aria-hidden="true" />
          </span>
          <div class="min-w-0">
            <h1 class="truncate text-2xl font-semibold tracking-tight text-white sm:text-3xl">{{ t('settings.title') }}</h1>
            <p class="mt-1 text-sm text-flixer-muted">{{ t('settings.subtitle') }}</p>
          </div>
        </div>
        <button v-if="isNativeApp()" type="button" class="inline-flex items-center gap-2 rounded border border-flixer-border bg-white/5 px-4 py-2.5 text-sm font-medium text-flixer-text transition hover:border-white/20 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent" @click="router.push({ name: 'connect' })">
          <Icon icon="lucide:server" class="size-4" aria-hidden="true" />
          {{ t('native.changeServer') }}
        </button>
      </header>

      <div class="grid min-w-0 gap-5 lg:grid-cols-[15rem_minmax(0,1fr)] lg:items-start">
        <nav class="admin-card flex min-w-0 gap-1 overflow-x-auto p-2 lg:sticky lg:top-20 lg:flex-col" :aria-label="t('settings.title')" role="tablist">
          <button
            v-for="tab in tabs"
            :id="`settings-tab-${tab.id}`"
            :key="tab.id"
            type="button"
            role="tab"
            class="group relative inline-flex min-h-11 shrink-0 items-center gap-3 rounded px-3 py-2.5 text-left text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent lg:w-full"
            :class="activeTab === tab.id ? 'bg-flixer-primary/20 text-white shadow-inner shadow-white/5' : 'text-flixer-text/70 hover:bg-white/5 hover:text-white'"
            :aria-selected="activeTab === tab.id"
            aria-controls="settings-panel"
            @click="selectTab(tab.id)"
          >
            <span class="grid size-8 shrink-0 place-items-center rounded" :class="activeTab === tab.id ? 'bg-flixer-primary/30 text-flixer-accent' : 'text-flixer-muted transition group-hover:text-white'">
              <Icon :icon="tabIcons[tab.id] ?? 'lucide:settings-2'" class="size-4" aria-hidden="true" />
            </span>
            <span class="whitespace-nowrap">{{ tab.label }}</span>
            <Icon v-if="activeTab === tab.id" icon="lucide:chevron-right" class="ml-auto hidden size-4 text-flixer-accent lg:block" aria-hidden="true" />
          </button>
        </nav>

        <section id="settings-panel" class="admin-card min-w-0 p-5 sm:p-6 lg:p-7" role="tabpanel" :aria-labelledby="`settings-tab-${activeTab}`" tabindex="0">
          <Transition name="settings-panel" mode="out-in">
            <div :key="activeTab">
              <ProfileSection v-if="activeTab === 'profile'" />
              <PasskeysSection v-else-if="activeTab === 'passkeys'" />
              <LanguageSection v-else-if="activeTab === 'language'" />
              <DefaultPlaybackOptionsSection v-else-if="activeTab === 'defaultPlayback'" />
              <ServerSection v-else-if="activeTab === 'server'" />
            </div>
          </Transition>
        </section>
      </div>
    </main>
  </div>
</template>

<style scoped>
.settings-panel-enter-active,
.settings-panel-leave-active {
  transition: opacity 140ms ease, transform 140ms ease;
}

.settings-panel-enter-from {
  opacity: 0;
  transform: translateY(4px);
}

.settings-panel-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

@media (prefers-reduced-motion: reduce) {
  .settings-panel-enter-active,
  .settings-panel-leave-active {
    transition: none;
  }
}
</style>
