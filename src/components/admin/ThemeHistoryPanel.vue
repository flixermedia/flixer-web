<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { listThemeVersions, restoreThemeVersion, type AppTheme, type ThemeVersion } from '../../api'
import { confirmAction } from '../../composables/confirm'
import { notify } from '../../composables/notify'
import { describeRequestError } from '../../composables/useProfile'
import ThemePreview from './ThemePreview.vue'

const props = defineProps<{ themeId: string }>()
const emit = defineEmits<{ restored: [theme: AppTheme] }>()
const { t } = useI18n()

const versions = ref<ThemeVersion[]>([])
const loading = ref(true)
const busy = ref(false)

onMounted(async () => {
  try {
    versions.value = await listThemeVersions(props.themeId)
  } catch (error) {
    notify.error(describeRequestError(error, t('admin.appearance.history.loadError')))
  } finally {
    loading.value = false
  }
})

async function restore(version: ThemeVersion) {
  if (busy.value || !(await confirmAction(t('admin.appearance.history.restoreConfirm', { date: new Date(version.createdAt).toLocaleString() })))) return
  busy.value = true
  try {
    const theme = await restoreThemeVersion(props.themeId, version.id)
    notify.success(t('admin.appearance.history.restored'))
    emit('restored', theme)
  } catch (error) {
    notify.error(describeRequestError(error, t('admin.appearance.history.restoreError')))
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="grid gap-3">
    <p class="text-sm text-flixer-muted">{{ t('admin.appearance.history.description') }}</p>
    <p v-if="loading" class="text-sm text-flixer-muted">{{ t('admin.appearance.loading') }}</p>
    <p v-else-if="!versions.length" class="rounded border border-dashed border-flixer-border p-6 text-center text-sm text-flixer-muted">{{ t('admin.appearance.history.empty') }}</p>
    <ul v-else class="grid gap-3 sm:grid-cols-2">
      <li v-for="version in versions" :key="version.id" class="grid gap-2 rounded border border-flixer-border bg-flixer-background/40 p-3">
        <ThemePreview :config="version.config" mode="dark" compact />
        <div class="flex items-center justify-between gap-2">
          <div class="min-w-0">
            <p class="truncate text-sm font-medium">{{ version.name }}</p>
            <p class="text-xs text-flixer-muted">{{ new Date(version.createdAt).toLocaleString() }}</p>
          </div>
          <button type="button" :disabled="busy" class="shrink-0 rounded border border-flixer-border px-3 py-1.5 text-xs font-semibold hover:bg-white/5 disabled:opacity-40" @click="restore(version)">{{ t('admin.appearance.history.restore') }}</button>
        </div>
      </li>
    </ul>
  </div>
</template>
