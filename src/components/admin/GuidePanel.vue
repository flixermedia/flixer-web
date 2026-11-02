<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { createGuideSource, deleteGuideSource, getAdminGuide, refreshGuideSource, updateGuideChannels, updateGuideSettings, updateGuideSource, type AdminGuideData, type GuideSource } from '../../api/guide'
import { describeRequestError } from '../../composables/useProfile'
import { catchError } from '../../utils/catchError'

interface SourceDraft {
  name: string
  url: string
  enabled: boolean
  sortOrder: number
}

interface ChannelDraft {
  id: string
  enabled: boolean
  sortOrder: number
  iptvChannelId: string | null
}

const { t } = useI18n()
const data = ref<AdminGuideData | null>(null)
const isLoading = ref(true)
const loadError = ref('')
const actionMessage = ref('')
const sourceDrafts = ref<Record<string, SourceDraft>>({})
const channelDrafts = ref<Record<string, ChannelDraft>>({})
const regionalMergeThresholdPercent = ref(65)
const sourceKind = ref<'epg' | 'iptv'>('epg')
const sourceName = ref('')
const sourceUrl = ref('')
const sourceBusy = ref('')
const sourceErrors = ref<Record<string, string>>({})
const busyAction = ref('')
const channelSaveError = ref('')
const settingsSaveError = ref('')

const sortedChannels = computed(() => [...(data.value?.channels ?? [])].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)))

function installData(value: AdminGuideData) {
  data.value = value
  sourceDrafts.value = Object.fromEntries(value.sources.map((source) => [source.id, { name: source.name, url: source.url, enabled: source.enabled, sortOrder: source.sortOrder }]))
  channelDrafts.value = Object.fromEntries(value.channels.map((channel) => [channel.id, { id: channel.id, enabled: channel.enabled, sortOrder: channel.sortOrder, iptvChannelId: channel.iptvChannelId }]))
  regionalMergeThresholdPercent.value = value.settings.regionalMergeThresholdPercent
}

async function load() {
  isLoading.value = true
  loadError.value = ''
  const [error, result] = await catchError(getAdminGuide())
  if (error) {
    loadError.value = describeRequestError(error, t('admin.guide.loadError'))
  } else {
    installData(result)
  }
  isLoading.value = false
}

async function addSource() {
  if (!sourceName.value.trim() || !sourceUrl.value.trim() || sourceBusy.value) return
  sourceBusy.value = 'new'
  sourceErrors.value = { ...sourceErrors.value, new: '' }
  const [error] = await catchError(createGuideSource({ kind: sourceKind.value, name: sourceName.value.trim(), url: sourceUrl.value.trim() }))
  if (error) {
    sourceErrors.value = { ...sourceErrors.value, new: describeRequestError(error, t('admin.guide.saveError')) }
  } else {
    sourceName.value = ''
    sourceUrl.value = ''
    actionMessage.value = t('admin.guide.sourceAdded')
    await load()
  }
  sourceBusy.value = ''
}

async function saveSource(source: GuideSource) {
  const draft = sourceDrafts.value[source.id]
  if (!draft || sourceBusy.value) return
  sourceBusy.value = source.id
  sourceErrors.value = { ...sourceErrors.value, [source.id]: '' }
  const [error] = await catchError(updateGuideSource(source.id, draft))
  if (error) {
    sourceErrors.value = { ...sourceErrors.value, [source.id]: describeRequestError(error, t('admin.guide.saveError')) }
  } else {
    actionMessage.value = t('admin.guide.sourceSaved')
    await load()
  }
  sourceBusy.value = ''
}

async function refreshSource(source: GuideSource) {
  if (sourceBusy.value) return
  sourceBusy.value = source.id
  sourceErrors.value = { ...sourceErrors.value, [source.id]: '' }
  const [error] = await catchError(refreshGuideSource(source.id))
  if (error) {
    sourceErrors.value = { ...sourceErrors.value, [source.id]: describeRequestError(error, t('admin.guide.refreshError')) }
  } else {
    actionMessage.value = t('admin.guide.sourceRefreshed')
    await load()
  }
  sourceBusy.value = ''
}

async function removeSource(source: GuideSource) {
  if (source.isDefault || sourceBusy.value || !window.confirm(t('admin.guide.confirmDelete', { name: source.name }))) return
  sourceBusy.value = source.id
  sourceErrors.value = { ...sourceErrors.value, [source.id]: '' }
  const [error] = await catchError(deleteGuideSource(source.id))
  if (error) {
    sourceErrors.value = { ...sourceErrors.value, [source.id]: describeRequestError(error, t('admin.guide.deleteError')) }
  } else {
    actionMessage.value = t('admin.guide.sourceDeleted')
    await load()
  }
  sourceBusy.value = ''
}

function setIptvChannel(channelId: string, value: string) {
  const draft = channelDrafts.value[channelId]
  if (draft) draft.iptvChannelId = value || null
}

async function saveChannels() {
  if (busyAction.value) return
  busyAction.value = 'channels'
  channelSaveError.value = ''
  const channels = Object.values(channelDrafts.value)
  const [error] = await catchError(updateGuideChannels(channels))
  if (error) {
    channelSaveError.value = describeRequestError(error, t('admin.guide.saveError'))
  } else {
    actionMessage.value = t('admin.guide.channelsSaved')
    await load()
  }
  busyAction.value = ''
}

async function saveSettings() {
  if (busyAction.value) return
  busyAction.value = 'settings'
  settingsSaveError.value = ''
  const [error] = await catchError(updateGuideSettings(regionalMergeThresholdPercent.value))
  if (error) {
    settingsSaveError.value = describeRequestError(error, t('admin.guide.saveError'))
  } else {
    actionMessage.value = t('admin.guide.settingsSaved')
    await load()
  }
  busyAction.value = ''
}

function channelMappingLabel(channelId: string | null): string {
  if (!channelId) return t('admin.guide.automaticMapping')
  const channel = data.value?.iptvChannels.find((entry) => entry.id === channelId)
  return channel ? `${channel.sourceName} · ${channel.name}` : t('admin.guide.unknownMapping')
}

onMounted(() => void load())
</script>

<template>
  <section class="space-y-6">
    <p class="sr-only" role="status" aria-live="polite">{{ actionMessage }}</p>
    <p v-if="loadError" role="alert" class="rounded border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200">{{ loadError }}</p>

    <div v-if="isLoading && !data" class="admin-card p-8 text-sm text-flixer-muted" role="status">{{ t('admin.guide.loading') }}</div>
    <div v-else-if="data" class="space-y-6">
      <section class="admin-card space-y-4 p-5 sm:p-6">
        <div>
          <h2 class="text-lg font-semibold text-white">{{ t('admin.guide.sourcesTitle') }}</h2>
          <p class="mt-1 text-sm text-flixer-muted">{{ t('admin.guide.sourcesDescription') }}</p>
        </div>

        <form class="grid gap-3 rounded border border-white/10 bg-white/[0.03] p-4 md:grid-cols-[9rem_minmax(10rem,1fr)_minmax(14rem,2fr)_auto]" @submit.prevent="addSource">
          <label class="space-y-1 text-xs text-flixer-muted">
            <span>{{ t('admin.guide.sourceKind') }}</span>
            <select v-model="sourceKind" class="h-10 w-full rounded border border-white/10 bg-flixer-surface px-3 text-sm text-white">
              <option value="epg">{{ t('admin.guide.epg') }}</option>
              <option value="iptv">{{ t('admin.guide.iptv') }}</option>
            </select>
          </label>
          <label class="space-y-1 text-xs text-flixer-muted">
            <span>{{ t('admin.guide.sourceName') }}</span>
            <input v-model="sourceName" required maxlength="120" class="h-10 w-full rounded border border-white/10 bg-flixer-surface px-3 text-sm text-white" :placeholder="t('admin.guide.namePlaceholder')" />
          </label>
          <label class="space-y-1 text-xs text-flixer-muted">
            <span>{{ t('admin.guide.sourceUrl') }}</span>
            <input v-model="sourceUrl" required type="url" class="h-10 w-full rounded border border-white/10 bg-flixer-surface px-3 text-sm text-white" :placeholder="t('admin.guide.urlPlaceholder')" />
          </label>
          <button type="submit" class="self-end rounded bg-flixer-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-flixer-secondary disabled:opacity-50" :disabled="sourceBusy === 'new'">{{ sourceBusy === 'new' ? t('admin.guide.adding') : t('admin.guide.addSource') }}</button>
          <p v-if="sourceErrors.new" class="text-sm text-red-300 md:col-span-full" role="alert">{{ sourceErrors.new }}</p>
        </form>

        <p v-if="data.sources.length === 0" class="rounded border border-white/10 p-4 text-sm text-flixer-muted">{{ t('admin.guide.noSources') }}</p>
        <article v-for="source in data.sources" :key="source.id" class="space-y-3 rounded border border-white/10 bg-white/[0.02] p-4">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <span class="rounded bg-flixer-accent/15 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-flixer-accent">{{ t(`admin.guide.${source.kind}`) }}</span>
              <span class="text-xs text-flixer-muted">{{ t('admin.guide.sourceCounts', { channels: source.channelCount, programmes: source.programmeCount }) }}</span>
              <span v-if="source.isDefault" class="rounded bg-white/10 px-2 py-1 text-[10px] font-semibold text-flixer-muted">{{ t('admin.guide.defaultSource') }}</span>
            </div>
            <label class="inline-flex items-center gap-2 text-sm text-white">
              <input v-model="sourceDrafts[source.id].enabled" type="checkbox" class="size-4 accent-flixer-accent" />
              {{ t('admin.guide.enabled') }}
            </label>
          </div>
          <div class="grid gap-3 md:grid-cols-[minmax(10rem,1fr)_minmax(14rem,2fr)_6rem]">
            <label class="space-y-1 text-xs text-flixer-muted">
              <span>{{ t('admin.guide.sourceName') }}</span>
              <input v-model="sourceDrafts[source.id].name" maxlength="120" class="h-10 w-full rounded border border-white/10 bg-flixer-surface px-3 text-sm text-white" />
            </label>
            <label class="space-y-1 text-xs text-flixer-muted">
              <span>{{ t('admin.guide.sourceUrl') }}</span>
              <input v-model="sourceDrafts[source.id].url" type="url" class="h-10 w-full rounded border border-white/10 bg-flixer-surface px-3 text-sm text-white" />
            </label>
            <label class="space-y-1 text-xs text-flixer-muted">
              <span>{{ t('admin.guide.sortOrder') }}</span>
              <input v-model.number="sourceDrafts[source.id].sortOrder" type="number" min="0" class="h-10 w-full rounded border border-white/10 bg-flixer-surface px-3 text-sm text-white" />
            </label>
          </div>
          <div class="flex flex-wrap gap-2">
            <button type="button" class="rounded bg-flixer-primary px-3 py-2 text-xs font-semibold text-white hover:bg-flixer-secondary disabled:opacity-50" :disabled="sourceBusy !== ''" @click="saveSource(source)">{{ sourceBusy === source.id ? t('admin.guide.saving') : t('admin.guide.saveSource') }}</button>
            <button type="button" class="rounded border border-white/15 px-3 py-2 text-xs font-semibold text-white hover:bg-white/10 disabled:opacity-50" :disabled="sourceBusy !== ''" @click="refreshSource(source)">{{ sourceBusy === source.id ? t('admin.guide.refreshing') : t('admin.guide.refresh') }}</button>
            <button type="button" class="rounded border border-red-400/30 px-3 py-2 text-xs font-semibold text-red-200 hover:bg-red-500/10 disabled:opacity-40" :disabled="sourceBusy !== '' || source.isDefault" @click="removeSource(source)">{{ t('admin.guide.deleteSource') }}</button>
            <span v-if="source.lastRefreshedAt" class="self-center text-xs text-flixer-muted">{{ t('admin.guide.lastRefreshed', { time: new Date(source.lastRefreshedAt).toLocaleString() }) }}</span>
          </div>
          <p v-if="source.lastError" class="rounded border border-red-400/20 bg-red-500/5 p-3 text-sm text-red-200" role="alert">{{ source.lastError }}</p>
          <p v-if="sourceErrors[source.id]" class="text-sm text-red-300" role="alert">{{ sourceErrors[source.id] }}</p>
        </article>
      </section>

      <section class="admin-card space-y-4 p-5 sm:p-6">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 class="text-lg font-semibold text-white">{{ t('admin.guide.channelsTitle') }}</h2>
            <p class="mt-1 text-sm text-flixer-muted">{{ t('admin.guide.channelsDescription') }}</p>
          </div>
          <button type="button" class="rounded bg-flixer-primary px-4 py-2 text-sm font-semibold text-white hover:bg-flixer-secondary disabled:opacity-50" :disabled="busyAction !== ''" @click="saveChannels">{{ busyAction === 'channels' ? t('admin.guide.saving') : t('admin.guide.saveChannels') }}</button>
        </div>
        <p v-if="channelSaveError" role="alert" class="text-sm text-red-300">{{ channelSaveError }}</p>
        <div v-if="sortedChannels.length" class="overflow-x-auto">
          <table class="w-full min-w-[46rem] border-collapse text-left text-sm">
            <thead>
              <tr class="border-b border-white/10 text-xs uppercase tracking-wide text-flixer-muted">
                <th class="px-3 py-2 font-semibold">{{ t('admin.guide.channelName') }}</th>
                <th class="px-3 py-2 font-semibold">{{ t('admin.guide.sourceName') }}</th>
                <th class="px-3 py-2 font-semibold">{{ t('admin.guide.enabled') }}</th>
                <th class="w-24 px-3 py-2 font-semibold">{{ t('admin.guide.sortOrder') }}</th>
                <th class="min-w-64 px-3 py-2 font-semibold">{{ t('admin.guide.iptvMapping') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="channel in sortedChannels" :key="channel.id" class="border-b border-white/[0.06] last:border-0">
                <td class="px-3 py-3">
                  <div class="flex items-center gap-2">
                    <img v-if="channel.icon" :src="channel.icon" alt="" class="size-8 rounded bg-white/5 object-contain p-1" loading="lazy" />
                    <div class="min-w-0">
                      <p class="truncate font-medium text-white">{{ channel.name }}</p>
                      <p class="truncate text-xs text-flixer-muted">{{ channel.id }}</p>
                    </div>
                  </div>
                </td>
                <td class="px-3 py-3 text-xs text-flixer-muted">{{ channel.sourceName }}</td>
                <td class="px-3 py-3"><input v-model="channelDrafts[channel.id].enabled" type="checkbox" class="size-4 accent-flixer-accent" :aria-label="t('admin.guide.enableChannel', { channel: channel.name })" /></td>
                <td class="px-3 py-3"><input v-model.number="channelDrafts[channel.id].sortOrder" type="number" min="0" class="h-9 w-20 rounded border border-white/10 bg-flixer-surface px-2 text-sm text-white" :aria-label="t('admin.guide.channelOrder', { channel: channel.name })" /></td>
                <td class="px-3 py-3">
                  <select :value="channelDrafts[channel.id].iptvChannelId ?? ''" class="h-9 w-full rounded border border-white/10 bg-flixer-surface px-2 text-xs text-white" :aria-label="t('admin.guide.mapChannel', { channel: channel.name })" @change="setIptvChannel(channel.id, ($event.target as HTMLSelectElement).value)">
                    <option value="">{{ t('admin.guide.automaticMapping') }}</option>
                    <option v-for="iptv in data.iptvChannels" :key="iptv.id" :value="iptv.id" :disabled="!iptv.playable">{{ iptv.sourceName }} · {{ iptv.name }}{{ iptv.playable ? '' : ` · ${t('admin.guide.notPlayable')}` }}</option>
                  </select>
                  <p v-if="!channel.iptvChannelId && channel.automaticIptvChannelId" class="mt-1 truncate text-[10px] text-flixer-muted">{{ t('admin.guide.automaticSuggestion', { name: channelMappingLabel(channel.automaticIptvChannelId) }) }}</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-else class="rounded border border-white/10 p-4 text-sm text-flixer-muted">{{ t('admin.guide.noChannels') }}</p>
      </section>

      <section class="admin-card space-y-4 p-5 sm:p-6">
        <div>
          <h2 class="text-lg font-semibold text-white">{{ t('admin.guide.settingsTitle') }}</h2>
          <p class="mt-1 text-sm text-flixer-muted">{{ t('admin.guide.settingsDescription') }}</p>
        </div>
        <form class="flex flex-wrap items-end gap-3" @submit.prevent="saveSettings">
          <label class="space-y-1 text-xs text-flixer-muted">
            <span>{{ t('admin.guide.regionalThreshold') }}</span>
            <input v-model.number="regionalMergeThresholdPercent" type="number" min="1" max="100" required class="h-10 w-32 rounded border border-white/10 bg-flixer-surface px-3 text-sm text-white" />
          </label>
          <span class="pb-2 text-sm text-flixer-muted">%</span>
          <button type="submit" class="rounded bg-flixer-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-flixer-secondary disabled:opacity-50" :disabled="busyAction !== ''">{{ busyAction === 'settings' ? t('admin.guide.saving') : t('admin.guide.saveSettings') }}</button>
        </form>
        <p v-if="settingsSaveError" role="alert" class="text-sm text-red-300">{{ settingsSaveError }}</p>
      </section>
    </div>

    <button v-if="loadError" type="button" class="rounded bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/15" @click="load">{{ t('admin.guide.retry') }}</button>
  </section>
</template>
