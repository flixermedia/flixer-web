<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { getAiAdminStatus, getMediaSearchAdminStatus, rebuildMediaSearchIndex } from '../../../api'
import { notify } from '../../../composables/notify'
import { describeRequestError } from '../../../composables/useProfile'
import { catchError } from '../../../utils/catchError'
import AdminSection from '../AdminSection.vue'
import { useWidgetData } from './useWidgetData'

const { t } = useI18n()
const rebuilding = ref(false)

const { data, failed, refresh } = useWidgetData(
  async () => {
    const [search, ai] = await Promise.all([
      getMediaSearchAdminStatus().catch(() => null),
      getAiAdminStatus().catch(() => null),
    ])
    if (!search && !ai) throw new Error('Unavailable')
    return { search, ai }
  },
  45_000,
)

async function rebuild() {
  if (rebuilding.value) return
  rebuilding.value = true
  const [error] = await catchError(rebuildMediaSearchIndex())
  rebuilding.value = false
  if (error) {
    notify.error(describeRequestError(error, t('errors.generic')))
    return
  }
  notify.success(t('admin.dashboard.searchRebuildQueued'))
  void refresh()
}
</script>

<template>
  <AdminSection :title="t('admin.dashboard.widgets.search-ai')" compact class="h-full">
    <p v-if="failed && !data" class="text-sm text-red-200">{{ t('admin.dashboard.loadError') }}</p>
    <template v-else-if="data">
      <div class="space-y-2.5 text-xs">
        <div class="flex items-center justify-between gap-2">
          <div>
            <p class="font-medium text-flixer-text">{{ t('admin.pages.search') }}</p>
            <p class="text-flixer-muted">
              <template v-if="data.search?.connected">
                {{ t('admin.dashboard.indexedDocs', { count: data.search.documentCount ?? 0 }) }}
              </template>
              <template v-else>
                {{ data.search?.enabled ? t('admin.dashboard.disconnected') : t('admin.dashboard.disabled') }}
              </template>
            </p>
          </div>
          <button
            v-if="data.search?.enabled"
            type="button"
            class="shrink-0 rounded bg-white/10 px-2 py-1 text-[11px] font-medium transition hover:bg-flixer-primary hover:text-white disabled:opacity-40"
            :disabled="rebuilding"
            @click="rebuild"
          >
            {{ rebuilding ? t('admin.dashboard.rebuilding') : t('admin.dashboard.rebuild') }}
          </button>
        </div>

        <div class="flex items-center justify-between gap-2 border-t border-white/10 pt-2">
          <div>
            <p class="font-medium text-flixer-text">{{ t('admin.pages.ai') }}</p>
            <p class="text-flixer-muted">
              {{ data.ai?.service?.modelReady ? t('admin.dashboard.aiReady', { profile: data.ai.service.activeProfile }) : data.ai?.configuration.enabled ? t('admin.dashboard.aiStarting') : t('admin.dashboard.disabled') }}
            </p>
          </div>
          <router-link :to="{ name: 'admin', query: { tab: 'settings', page: 'ai' } }" class="text-[11px] font-medium text-flixer-accent hover:underline">
            {{ t('admin.dashboard.configure') }}
          </router-link>
        </div>
      </div>
    </template>
    <p v-else class="text-sm text-flixer-muted">{{ t('common.loading') }}</p>
  </AdminSection>
</template>
