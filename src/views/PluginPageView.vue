<script setup lang="ts">
import { computed, onBeforeUnmount, provide, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { callPluginOperation } from '../api'
import Header from '../components/header/Header.vue'
import MobileTabBar from '../components/home/MobileTabBar.vue'
import PluginNode from '../components/plugins/PluginNode.vue'
import { getMobileTabs, getNavLinks } from '../composables/homeNav'
import { pluginViewContextKey, usePluginActions, type PluginViewContext } from '../composables/usePluginActions'
import { usePluginPages } from '../composables/usePluginPages'
import { describeRequestError } from '../composables/useProfile'
import { useSignOut } from '../composables/useSignOut'
import { applyQuery, queryFromRoute, resolveNav } from '../plugins/pageLogic'
import { sanitizePageResponse } from '../plugins/viewSchema'
import type { PluginNav, PluginPageResponse } from '../plugins/viewTypes'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const { isSigningOut, signOut } = useSignOut()
const { pages } = usePluginPages()
const navLinks = computed(getNavLinks)
const mobileTabs = computed(getMobileTabs)

const pluginId = computed(() => String(route.params.pluginId ?? ''))
const pageId = computed(() => String(route.params.pageId ?? ''))
const query = computed(() => queryFromRoute(route.query))
const queryKey = computed(() => JSON.stringify(Object.entries(query.value).sort(([a], [b]) => a.localeCompare(b))))

const page = ref<PluginPageResponse | null>(null)
const loading = ref(false)
const errorMessage = ref('')
let sequence = 0

const listedTitle = computed(() => pages.value.find((entry) => entry.pluginId === pluginId.value && entry.id === pageId.value)?.title)
const title = computed(() => page.value?.title || listedTitle.value || '')

async function load() {
  const current = ++sequence
  loading.value = true
  errorMessage.value = ''
  try {
    const raw = await callPluginOperation(pluginId.value, 'page', { page: pageId.value, query: query.value })
    if (current !== sequence) return
    const result = sanitizePageResponse(raw)
    if (!result) {
      page.value = null
      errorMessage.value = t('plugins.view.invalid')
      return
    }
    page.value = result
  } catch (error) {
    if (current !== sequence) return
    page.value = null
    errorMessage.value = describeRequestError(error, t('plugins.view.loadError'))
  } finally {
    if (current === sequence) loading.value = false
  }
}

function applyTitle() {
  const base = t('router.defaultTitle')
  document.title = title.value ? `${title.value} · ${base}` : base
}

function push(next: Record<string, string>) {
  void router.push({ query: next })
}

function navigate(nav: PluginNav) {
  push(resolveNav(query.value, nav))
}

const actions = usePluginActions({ pluginId: () => pluginId.value, navigate, reload: () => void load() })

const context: PluginViewContext = {
  query,
  busy: actions.busy,
  run: actions.run,
  patchQuery: (patch, reset) => push(applyQuery(query.value, patch, reset)),
}
provide(pluginViewContextKey, context)

watch([pluginId, pageId], () => {
  page.value = null
})
watch([pluginId, pageId, queryKey], () => void load(), { immediate: true })
// The router resets the title after every navigation, so re-apply it once the DOM has settled.
watch([title, () => route.fullPath], applyTitle, { flush: 'post', immediate: true })

onBeforeUnmount(() => {
  sequence += 1
})
</script>

<template>
  <div class="min-h-screen overflow-x-hidden bg-flixer-background pb-28 pt-24 text-flixer-text md:pb-12 md:pt-28">
    <Header :links="navLinks" :is-signing-out="isSigningOut" @logout="signOut" />
    <main class="page-gutter mx-auto max-w-6xl">
      <div v-if="page" :aria-busy="loading">
        <PluginNode :node="page.view" />
      </div>
      <div v-else-if="errorMessage" class="admin-card p-6 text-sm" role="alert">
        <p class="text-red-300">{{ errorMessage }}</p>
        <button type="button" class="mt-4 rounded border border-flixer-border px-3 py-2 text-sm font-semibold transition hover:bg-white/5" @click="load">{{ t('plugins.view.retry') }}</button>
      </div>
      <p v-else class="py-10 text-sm text-flixer-muted" role="status">{{ t('plugins.view.loading') }}</p>
    </main>
    <MobileTabBar :tabs="mobileTabs" />
  </div>
</template>
