<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { isTvMode } from '../../platform/tvMode'
import HomeView from '../../views/HomeView.vue'
import PageCanvas from './PageCanvas.vue'
import { getPageHome, type PublishedPage } from './pageBuilder'
import { useProfile } from '../../composables/useProfile'

const { profile } = useProfile()

const loading = ref(!isTvMode.value)
const page = ref<PublishedPage | null>(null)
onMounted(async () => {
    if (isTvMode.value) return
    try { page.value = await getPageHome() } catch { page.value = null }
    finally { loading.value = false }
})
</script>

<template>
    <main v-if="page" class="min-h-screen bg-flixer-background pt-20 text-flixer-text">
        <div v-if="profile?.role === 'admin'" class="flex justify-end px-6 pt-3">
            <RouterLink :to="{ name: 'page-builder', params: { slug: page.slug } }"
                class="rounded border border-flixer-border bg-flixer-surface px-3 py-1.5 text-xs font-medium text-flixer-text hover:border-flixer-accent">
                Edit page
            </RouterLink>
        </div>
        <PageCanvas :blocks="page.blocks" :layout="page.layout" />
    </main>
    <HomeView v-else-if="!loading" />
</template>