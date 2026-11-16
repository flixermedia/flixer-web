<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { getPublishedPage, type PublishedPage } from './pageBuilder'
import PageCanvas from './PageCanvas.vue'
import axios from 'axios'
import { getAccessToken } from '../../api/client'

const route = useRoute()
const { t } = useI18n()
const page = ref<PublishedPage | null>(null)
const loading = ref(true)
const requiresSignIn = ref(false)
watch(() => route.params.slug, async (slug, _previous, onCleanup) => {
  let active = true
  onCleanup(() => { active = false })
  loading.value = true
  page.value = null
  requiresSignIn.value = false
  try {
    const result = await getPublishedPage(String(slug))
    if (active && result.slug !== 'login') page.value = result
  } catch (error) {
    if (active && axios.isAxiosError(error) && error.response?.status === 401) requiresSignIn.value = true
    if (active) page.value = null
  } finally {
    if (active) loading.value = false
  }
}, { immediate: true })
</script>

<template>
  <main class="min-h-screen bg-flixer-background text-flixer-text" :class="{ 'pt-20': getAccessToken() }">
    <PageCanvas v-if="page" :blocks="page.blocks" :layout="page.layout" />
    <p v-else-if="loading" role="status" class="p-8 text-flixer-muted">{{ t('pageBuilder.loading') }}</p>
    <div v-else-if="requiresSignIn" class="p-8">
      <p>{{ t('pageBuilder.signInRequired') }}</p>
      <RouterLink :to="{ name: 'login', query: { redirect: route.fullPath } }"
        class="mt-3 inline-block text-flixer-accent underline">{{ t('auth.signInToFlixer') }}</RouterLink>
    </div>
    <p v-else role="alert" class="p-8 text-flixer-muted">{{ t('pageBuilder.notFound') }}</p>
  </main>
</template>