<script setup lang="ts">
import * as Sentry from '@sentry/vue'
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdminSkeleton from './AdminSkeleton.vue'
import { listSettings, updateSetting, type ServerSetting } from '../../api'
import { notify } from '../../composables/notify'
import { describeRequestError } from '../../composables/useProfile'
import AdminSection from './AdminSection.vue'
import AdminToggle from './AdminToggle.vue'

const APPS = ['flixer', 'streamer', 'indexer', 'web'] as const

const { t } = useI18n()
const values = ref<Record<string, unknown>>({})
const isLoading = ref(true)
const savingKey = ref<string | null>(null)

const globalEnabled = computed(() => values.value.sentry_enabled === true)

async function load() {
  try {
    const settings = await listSettings()
    values.value = Object.fromEntries(settings.map((setting: ServerSetting) => [setting.key, setting.value]))
  } catch (error: unknown) {
    console.error('[monitoring] failed to load settings', error)
    notify.error(describeRequestError(error, t('admin.monitoring.loadFailed')))
  } finally {
    isLoading.value = false
  }
}

async function save(key: string, value: unknown, label: string) {
  savingKey.value = key
  try {
    const saved = await updateSetting(key, value)
    values.value = { ...values.value, [key]: saved.value }
    notify.success(t('admin.monitoring.saved', { setting: label }))
  } catch (error: unknown) {
    console.error('[monitoring] failed to save setting', key, error)
    notify.error(describeRequestError(error, t('admin.monitoring.saveFailed')))
    await load()
  } finally {
    savingKey.value = null
  }
}

function saveDsn(app: (typeof APPS)[number], event: Event) {
  const input = event.target as HTMLInputElement
  const key = `sentry_${app}_dsn`
  const value = input.value.trim()
  if (value === ((values.value[key] as string | null) ?? '')) return
  if (value && !URL.canParse(value)) {
    notify.error(t('admin.monitoring.dsnInvalid'))
    input.value = (values.value[key] as string | null) ?? ''
    return
  }
  void save(key, value || null, t('admin.monitoring.dsn', { app: t(`admin.monitoring.apps.${app}`) }))
}

async function sendTestAlert() {
  if (!Sentry.isInitialized()) {
    notify.error(t('admin.monitoring.testDisabled'))
    return
  }
  Sentry.captureException(new Error(`Flixer web test alert (${new Date().toISOString()})`))
  await Sentry.flush(5_000)
  notify.success(t('admin.monitoring.testSent'))
}

onMounted(load)
</script>

<template>
  <AdminSection :title="t('admin.monitoring.title')" :description="t('admin.monitoring.description')">
    <AdminSkeleton v-if="isLoading" variant="toggles" :rows="3" />
    <template v-else>
      <AdminToggle :model-value="globalEnabled" :label="t('admin.monitoring.global')" :description="t('admin.monitoring.globalDescription')" :class="{ 'pointer-events-none opacity-60': savingKey === 'sentry_enabled' }" @update:model-value="save('sentry_enabled', $event, t('admin.monitoring.global'))" />
      <div class="mt-2 flex flex-col gap-4" :class="{ 'opacity-60': !globalEnabled }">
        <div v-for="app in APPS" :key="app" class="rounded border border-flixer-border p-3">
          <AdminToggle :model-value="values[`sentry_${app}_enabled`] === true" :label="t('admin.monitoring.appEnabled', { app: t(`admin.monitoring.apps.${app}`) })" :class="{ 'pointer-events-none opacity-60': savingKey === `sentry_${app}_enabled` }" @update:model-value="save(`sentry_${app}_enabled`, $event, t('admin.monitoring.appEnabled', { app: t(`admin.monitoring.apps.${app}`) }))" />
          <label class="mt-1 block text-xs text-flixer-muted">
            {{ t('admin.monitoring.dsn', { app: t(`admin.monitoring.apps.${app}`) }) }}
            <input type="text" :value="(values[`sentry_${app}_dsn`] as string | null) ?? ''" :disabled="savingKey === `sentry_${app}_dsn`" class="mt-1 w-full rounded border border-flixer-border bg-flixer-background px-3 py-2 font-mono text-sm text-flixer-text disabled:opacity-60" @change="saveDsn(app, $event)" />
          </label>
        </div>
      </div>
      <div class="mt-4 flex flex-col gap-2">
        <p class="text-xs text-flixer-muted">{{ t('admin.monitoring.testDescription') }}</p>
        <button type="button" class="self-start rounded border border-flixer-border px-3 py-2 text-sm text-flixer-text hover:bg-flixer-border/40" @click="sendTestAlert">{{ t('admin.monitoring.test') }}</button>
      </div>
    </template>
  </AdminSection>
</template>
