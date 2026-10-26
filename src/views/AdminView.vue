<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import AdminTabs from '../components/admin/AdminTabs.vue'
import { adminQuery, resolveAdminLocation, type AdminLocation } from '../components/admin/adminNav'
import { ADMIN_PAGE_BLOCKS } from '../components/admin/adminPages'
import PluginSettingsPage from '../components/admin/PluginSettingsPage.vue'
import Header from '../components/header/Header.vue'
import { useAdminTabs } from '../composables/useAdminTabs'
import { useSignOut } from '../composables/useSignOut'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const { isSigningOut, signOut } = useSignOut()

const tabs = useAdminTabs()
const location = computed(() => resolveAdminLocation(route.query.tab, route.query.page))
const blocks = computed(() => ADMIN_PAGE_BLOCKS[location.value.page])
const pluginId = computed(() => (location.value.tab === 'plugins' && typeof route.query.plugin === 'string' ? route.query.plugin : ''))

function open({ tab, page }: AdminLocation) {
  // Filters such as the media search belong to the page that set them, so they do not follow to the next one.
  const query = Object.fromEntries(Object.entries(route.query).filter(([key]) => !key.startsWith('m') && key !== 'tab' && key !== 'page'))
  void router.replace({ query: { ...query, ...adminQuery(tab, page) } })
}
</script>

<template>
  <div class="min-h-screen overflow-x-hidden bg-flixer-background font-sans text-flixer-text">
    <Header :links="[]" :is-signing-out="isSigningOut" @logout="signOut" />

    <main class="page-gutter w-full pb-16 pt-28">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h1 class="text-3xl font-semibold tracking-tight text-white">{{ t('admin.title') }}</h1>
        <div id="admin-header-actions" class="flex items-center"></div>
      </div>
      <p class="mt-2 text-sm text-flixer-muted">{{ t('admin.subtitle') }}</p>

      <nav class="mt-3" :aria-label="t('admin.adminNavigation')">
        <AdminTabs :tabs="tabs" :active="location" class="w-fit max-w-full" @select="open" />
      </nav>

      <div v-if="pluginId" class="mt-8">
        <PluginSettingsPage :key="pluginId" :plugin-id="pluginId" />
      </div>
      <div v-else class="mt-8 flex flex-col gap-10">
        <component :is="block.component" v-for="(block, index) in blocks" :key="`${location.page}-${index}`" v-bind="block.props" />
      </div>
    </main>
  </div>
</template>
