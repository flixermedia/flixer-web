<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { listPluginInstallations } from '../../api'
import { catchError } from '../../utils/catchError'
import PluginSettingsForm from './PluginSettingsForm.vue'
import OAuthProvidersSettings from './OAuthProvidersSettings.vue'

const props = defineProps<{ pluginId: string }>()
const { t } = useI18n()
const router = useRouter()
const name = ref('')
const hasOAuthProfiles = ref(false)

function back() {
  void router.push({ query: { tab: 'plugins' } })
}

onMounted(async () => {
  const [error, installations] = await catchError(listPluginInstallations())
  if (error) {
    name.value = ''
  } else {
    const plugin = installations.find((installation) => installation.id === props.pluginId)
    name.value = plugin?.manifest.name ?? ''
    hasOAuthProfiles.value = plugin?.manifest.capabilities.includes('auth.oauth.profiles') ?? false
  }
})
</script>

<template>
  <div class="flex flex-col gap-6">
    <button type="button"
      class="w-fit text-sm text-flixer-muted transition hover:text-white focus-visible:outline-2 focus-visible:outline-flixer-accent"
      @click="back">&larr; {{ t('admin.plugins.backToPlugins') }}</button>
    <OAuthProvidersSettings v-if="hasOAuthProfiles" :plugin-id="pluginId"
      :title="t('admin.plugins.settingsTitle', { name: name || pluginId })" />
    <PluginSettingsForm v-else :plugin-id="pluginId"
      :title="t('admin.plugins.settingsTitle', { name: name || pluginId })" />
  </div>
</template>
