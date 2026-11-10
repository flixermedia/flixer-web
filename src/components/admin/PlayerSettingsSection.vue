<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { listSettings, updateSetting } from '../../api'
import { notify } from '../../composables/notify'
import { describeRequestError } from '../../composables/useProfile'
import AdminSection from './AdminSection.vue'
import AdminToggle from './AdminToggle.vue'

const { t } = useI18n()
const keys = ['player_crop_trailers', 'player_crop_movies', 'player_crop_tv'] as const
type Key = typeof keys[number]
const values = ref<Record<Key, boolean>>({ player_crop_trailers: false, player_crop_movies: false, player_crop_tv: false })
const loading = ref(true)
const saving = ref(false)

onMounted(async () => {
  try {
    const settings = await listSettings()
    for (const key of keys) {
      const value = settings.find((setting) => setting.key === key)?.value
      if (typeof value !== 'boolean') throw new Error(`Missing or invalid setting: ${key}`)
      values.value[key] = value
    }
  } catch (error) {
    console.error('[player-settings] failed to load', error)
    notify.error(describeRequestError(error, t('admin.playerSettings.loadError')))
    return
  }
  loading.value = false
})

async function setValue(key: Key, value: boolean) {
  saving.value = true
  try {
    await updateSetting(key, value)
    values.value[key] = value
  } catch (error) {
    console.error('[player-settings] failed to save', error)
    notify.error(describeRequestError(error, t('admin.playerSettings.saveError')))
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <AdminSection :title="t('admin.playerSettings.title')" :description="t('admin.playerSettings.description')">
    <div class="space-y-4">
      <AdminToggle v-for="key in keys" :key="key" :model-value="values[key]" :disabled="loading || saving" :label="t(`admin.playerSettings.${key}`)" @update:model-value="setValue(key, $event)" />
      <p class="text-sm text-flixer-muted">{{ t('admin.playerSettings.hint') }}</p>
    </div>
  </AdminSection>
</template>
