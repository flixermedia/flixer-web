<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { listPluginInstallations } from '../../api'
import PluginSettingsForm from './PluginSettingsForm.vue'

const props = defineProps<{ pluginId: string }>()
const { t } = useI18n()
const router = useRouter()
const name = ref('')

function back() {
  void router.push({ query: { tab: 'plugins' } })
}

onMounted(async () => {
  try {
    name.value = (await listPluginInstallations()).find((plugin) => plugin.id === props.pluginId)?.manifest.name ?? ''
  } catch {
    name.value = ''
  }
})
</script>

<template>
  <div class="flex flex-col gap-6">
    <button type="button" class="w-fit text-sm text-flixer-muted transition hover:text-white focus-visible:outline-2 focus-visible:outline-flixer-accent" @click="back">&larr; {{ t('admin.plugins.backToPlugins') }}</button>
    <PluginSettingsForm :plugin-id="pluginId" :title="t('admin.plugins.settingsTitle', { name: name || pluginId })" />
  </div>
</template>
