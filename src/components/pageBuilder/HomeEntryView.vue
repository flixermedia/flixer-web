<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { isTvMode } from '../../platform/tvMode'
import HomeView from '../../views/HomeView.vue'
import PageCanvas from './PageCanvas.vue'
import { getPageHome, type PublishedPage } from './pageBuilder'

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
        <PageCanvas :blocks="page.blocks" :layout="page.layout" />
    </main>
    <HomeView v-else-if="!loading" />
</template>