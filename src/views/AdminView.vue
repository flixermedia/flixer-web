<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import AdminSidebar from '../components/admin/AdminSidebar.vue'
import { adminQuery, resolveAdminLocation, type AdminLocation } from '../components/admin/adminNav'
import { ADMIN_PAGE_BLOCKS } from '../components/admin/adminPages'
import PluginSettingsPage from '../components/admin/PluginSettingsPage.vue'
import Header from '../components/header/Header.vue'
import { useAdminTabs } from '../composables/useAdminTabs'
import { useAdminSidebar } from '../composables/useAdminSidebar'
import { useSignOut } from '../composables/useSignOut'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const { isSigningOut, signOut } = useSignOut()
const { compact: sidebarCompact, toggleCompact: toggleSidebarCompact } = useAdminSidebar()

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
    <Header :docked="true" :links="[]" :is-signing-out="isSigningOut" @logout="signOut" />

    <main class="page-gutter w-full pb-16 pt-20 transition-[margin-left,width] duration-300 ease-in-out motion-reduce:transition-none lg:pt-16" :class="sidebarCompact ? 'lg:ml-20 lg:w-[calc(100%-5rem)]' : 'lg:ml-60 lg:w-[calc(100%-15rem)]'">
      <AdminSidebar :tabs="tabs" :active="location" :title="location.page === 'overview' ? t('admin.title') : t(`admin.pages.${location.page}`)" :subtitle="t(`admin.subtitles.${location.page}`)" :compact="sidebarCompact" @select="open" @toggle-compact="toggleSidebarCompact" />

      <Transition name="admin-page" mode="out-in">
        <section :key="`${location.page}:${pluginId}`" class="min-w-0">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div id="admin-header-actions" class="flex items-center"></div>
          </div>

          <div v-if="pluginId" class="mt-4">
            <PluginSettingsPage :key="pluginId" :plugin-id="pluginId" />
          </div>
          <div v-else class="mt-4 flex flex-col gap-10">
            <component :is="block.component" v-for="(block, index) in blocks" :key="`${location.page}-${index}`" v-bind="block.props" />
          </div>
        </section>
      </Transition>
    </main>
  </div>
</template>

<style scoped>
.admin-page-enter-active,
.admin-page-leave-active {
  transition: opacity 180ms ease;
}

.admin-page-enter-from,
.admin-page-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .admin-page-enter-active,
  .admin-page-leave-active {
    transition: none;
  }
}
</style>
