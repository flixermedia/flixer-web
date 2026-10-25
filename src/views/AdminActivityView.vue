<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import ActivityPanel from '../components/admin/ActivityPanel.vue'
import AdminTabs from '../components/admin/AdminTabs.vue'
import { adminQuery, type AdminLocation } from '../components/admin/adminNav'
import Header from '../components/header/Header.vue'
import { useAdminTabs } from '../composables/useAdminTabs'
import { useSignOut } from '../composables/useSignOut'

const router = useRouter()
const { t } = useI18n()
const { isSigningOut, signOut } = useSignOut()

const tabs = useAdminTabs()
const active: AdminLocation = { tab: 'dashboard', page: 'overview' }

function open({ tab, page }: AdminLocation) {
  void router.push({ name: 'admin', query: adminQuery(tab, page) })
}
</script>

<template>
  <div class="min-h-screen overflow-x-hidden bg-flixer-background font-sans text-flixer-text">
    <Header :links="[]" :is-signing-out="isSigningOut" @logout="signOut" />

    <main class="page-gutter w-full pb-16 pt-28">
      <h1 class="text-3xl font-semibold tracking-tight">{{ t('admin.title') }}</h1>
      <p class="mt-2 text-sm text-flixer-muted">{{ t('admin.subtitle') }}</p>

      <nav class="mt-3" :aria-label="t('admin.adminNavigation')">
        <AdminTabs :tabs="tabs" :active="active" class="w-fit max-w-full" @select="open" />
      </nav>

      <div class="mt-8">
        <ActivityPanel />
      </div>
    </main>
  </div>
</template>
