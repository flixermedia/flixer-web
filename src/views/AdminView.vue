<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import AdminTabs from '../components/admin/AdminTabs.vue'
import { adminQuery, resolveAdminLocation, type AdminLocation, type StaticAdminPageId } from '../components/admin/adminNav'
import { ADMIN_PAGE_BLOCKS } from '../components/admin/adminPages'
import Header from '../components/header/Header.vue'
import PluginSettingsForm from '../components/admin/PluginSettingsForm.vue'
import { refreshPluginAdminPages, useAdminTabs, usePluginAdminPages } from '../composables/useAdminTabs'
import { useSignOut } from '../composables/useSignOut'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const { isSigningOut, signOut } = useSignOut()

const tabs = useAdminTabs()
const pluginPages = usePluginAdminPages()
const location = computed(() => resolveAdminLocation(route.query.tab, route.query.page, pluginPages.value.map((page) => page.key)))
const blocks = computed(() => {
  const page = location.value.page
  const plugin = pluginPages.value.find((entry) => entry.key === page)
  if (plugin) return [{ component: PluginSettingsForm, props: { pluginId: plugin.pluginId, title: plugin.title, description: plugin.description } }]
  return ADMIN_PAGE_BLOCKS[page as StaticAdminPageId] ?? []
})

onMounted(refreshPluginAdminPages)

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
      <h1 class="bg-linear-to-r from-white to-flixer-accent bg-clip-text text-3xl font-semibold tracking-tight text-transparent">{{ t('admin.title') }}</h1>
      <p class="mt-2 text-sm text-flixer-muted">{{ t('admin.subtitle') }}</p>

      <nav class="mt-3" :aria-label="t('admin.adminNavigation')">
        <AdminTabs :tabs="tabs" :active="location" class="w-fit max-w-full" @select="open" />
      </nav>

      <div class="mt-8 flex flex-col gap-10">
        <component :is="block.component" v-for="(block, index) in blocks" :key="`${location.page}-${index}`" v-bind="block.props" />
      </div>
    </main>
  </div>
</template>
