<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import ActivityPanel from '../components/admin/ActivityPanel.vue'
import AdminSidebar from '../components/admin/AdminSidebar.vue'
import { adminQuery, type AdminLocation } from '../components/admin/adminNav'
import Header from '../components/header/Header.vue'
import { useAdminTabs } from '../composables/useAdminTabs'
import { useAdminSidebar } from '../composables/useAdminSidebar'
import { useSignOut } from '../composables/useSignOut'

const router = useRouter()
const { t } = useI18n()
const { isSigningOut, signOut } = useSignOut()
const { compact: sidebarCompact, toggleCompact: toggleSidebarCompact } = useAdminSidebar()

const tabs = useAdminTabs()
const active: AdminLocation = { tab: 'dashboard', page: 'overview' }

function open({ tab, page }: AdminLocation) {
  void router.push({ name: 'admin', query: adminQuery(tab, page) })
}
</script>

<template>
  <div class="min-h-screen overflow-x-hidden bg-flixer-background font-sans text-flixer-text">
    <Header :docked="true" :links="[]" :is-signing-out="isSigningOut" @logout="signOut" />

    <main class="page-gutter w-full pb-16 pt-20 transition-[margin-left,width] duration-300 ease-in-out motion-reduce:transition-none lg:pt-16" :class="sidebarCompact ? 'lg:ml-20 lg:w-[calc(100%-5rem)]' : 'lg:ml-60 lg:w-[calc(100%-15rem)]'">
      <AdminSidebar :tabs="tabs" :active="active" :title="t('admin.title')" :subtitle="t('admin.subtitle')" :compact="sidebarCompact" @select="open" @toggle-compact="toggleSidebarCompact" />

      <section class="min-w-0">
        <div class="mt-4">
          <ActivityPanel />
        </div>
      </section>
    </main>
  </div>
</template>
