<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter, type LocationQueryValue } from 'vue-router'
import { getAdminActivity, type AdminActivityPage } from '../../api'
import AdminSection from './AdminSection.vue'
import AdminSkeleton from './AdminSkeleton.vue'
import StatusPill from './StatusPill.vue'
import { useActivityFormat } from '../../composables/useActivityFormat'
import { describeRequestError } from '../../composables/useProfile'
import { catchError } from '../../utils/catchError'

const PAGE_SIZE = 25
const SORTS = ['recent', 'oldest', 'user', 'title'] as const
const TYPES = ['movie', 'episode', 'track', 'video'] as const

const route = useRoute()
const router = useRouter()
const { t, locale } = useI18n()
const { relativeTime, activityTitle, progressPercent } = useActivityFormat()

const single = (value: LocationQueryValue | LocationQueryValue[] | undefined) => (typeof value === 'string' ? value : '')

const filters = computed(() => ({
  search: single(route.query.search),
  user: single(route.query.user),
  type: single(route.query.type),
  status: single(route.query.status),
  from: single(route.query.from),
  to: single(route.query.to),
  sort: single(route.query.sort) || 'recent',
  page: Math.max(1, Number.parseInt(single(route.query.page), 10) || 1),
}))
const hasFilters = computed(() => Boolean(filters.value.search || filters.value.user || filters.value.type || filters.value.status || filters.value.from || filters.value.to))

const data = ref<AdminActivityPage | null>(null)
const loading = ref(true)
const error = ref('')
let requestId = 0

async function load() {
  const current = ++requestId
  loading.value = true
  try {
    const [requestError, result] = await catchError(getAdminActivity({ ...filters.value, page: String(filters.value.page), pageSize: String(PAGE_SIZE) }))
    if (requestError) {
      if (current !== requestId) return
      error.value = describeRequestError(requestError, t('admin.activity.loadError'))
    } else if (current === requestId) {
      data.value = result
      error.value = ''
    }
  } finally {
    if (current === requestId) loading.value = false
  }
}

// Filters live in the URL so a filtered view can be bookmarked or shared; changing one returns to the first page.
function setFilters(changes: Record<string, string | number | undefined>) {
  const next: Record<string, string> = {}
  for (const [key, value] of Object.entries({ ...route.query, ...('page' in changes ? {} : { page: undefined }), ...changes })) {
    const text = typeof value === 'number' ? String(value) : single(value as LocationQueryValue)
    if (text !== '' && !(key === 'page' && text === '1') && !(key === 'sort' && text === 'recent')) next[key] = text
  }
  void router.replace({ query: next })
}

const searchText = ref(filters.value.search)
let searchTimer: ReturnType<typeof setTimeout> | undefined
watch(searchText, (value) => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    if (value.trim() !== filters.value.search) setFilters({ search: value.trim() })
  }, 300)
})
watch(
  () => filters.value.search,
  (value) => {
    if (value !== searchText.value.trim()) searchText.value = value
  },
)
onBeforeUnmount(() => clearTimeout(searchTimer))

watch(
  () => route.query,
  () => {
    if (route.name === 'admin-activity') void load()
  },
  { immediate: true },
)

function reset() {
  searchText.value = ''
  void router.replace({ query: {} })
}

const pageCount = computed(() => Math.max(1, Math.ceil((data.value?.total ?? 0) / PAGE_SIZE)))
const rangeStart = computed(() => ((data.value?.total ?? 0) === 0 ? 0 : (filters.value.page - 1) * PAGE_SIZE + 1))
const rangeEnd = computed(() => Math.min(data.value?.total ?? 0, filters.value.page * PAGE_SIZE))

const summaryCards = computed(() => [
  { label: t('admin.activity.summary.total'), value: data.value?.summary.total ?? 0 },
  { label: t('admin.activity.summary.finished'), value: data.value?.summary.finished ?? 0 },
  { label: t('admin.activity.summary.inProgress'), value: data.value?.summary.inProgress ?? 0 },
  { label: t('admin.activity.summary.users'), value: data.value?.summary.users ?? 0 },
])

const fieldClass = 'h-10 w-full rounded border border-flixer-border bg-flixer-background px-3 text-sm text-flixer-text placeholder:text-flixer-muted focus-visible:outline-2 focus-visible:outline-flixer-accent scheme-dark'
const absoluteTime = (iso: string) => new Date(iso).toLocaleString(locale.value)
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <div v-for="card in summaryCards" :key="card.label" class="admin-card p-5">
        <p class="text-xs text-flixer-muted">{{ card.label }}</p>
        <p class="mt-1 text-3xl font-semibold transition-opacity" :class="loading ? 'opacity-50' : ''">{{ card.value.toLocaleString(locale) }}</p>
      </div>
    </div>

    <AdminSection :title="t('admin.activity.title')" :description="t('admin.activity.subtitle')">
      <form class="grid gap-3 sm:grid-cols-2 lg:grid-cols-6" role="search" @submit.prevent>
        <input v-model="searchText" type="search" autocomplete="off" :placeholder="t('admin.activity.search')" :aria-label="t('admin.activity.search')" :class="fieldClass" class="sm:col-span-2" />
        <select :value="filters.user" :aria-label="t('admin.activity.user')" :class="fieldClass" @change="setFilters({ user: ($event.target as HTMLSelectElement).value })">
          <option value="">{{ t('admin.activity.allUsers') }}</option>
          <option v-for="user in data?.users ?? []" :key="user.id" :value="user.id">{{ user.name }}</option>
        </select>
        <select :value="filters.type" :aria-label="t('admin.activity.type.label')" :class="fieldClass" @change="setFilters({ type: ($event.target as HTMLSelectElement).value })">
          <option value="">{{ t('admin.activity.type.all') }}</option>
          <option v-for="type in TYPES" :key="type" :value="type">{{ t(`admin.activity.type.${type}`) }}</option>
        </select>
        <select :value="filters.status" :aria-label="t('admin.activity.status.label')" :class="fieldClass" @change="setFilters({ status: ($event.target as HTMLSelectElement).value })">
          <option value="">{{ t('admin.activity.status.all') }}</option>
          <option value="finished">{{ t('admin.activity.status.finished') }}</option>
          <option value="in_progress">{{ t('admin.activity.status.inProgress') }}</option>
        </select>
        <select :value="filters.sort" :aria-label="t('admin.activity.sort.label')" :class="fieldClass" @change="setFilters({ sort: ($event.target as HTMLSelectElement).value })">
          <option v-for="sort in SORTS" :key="sort" :value="sort">{{ t(`admin.activity.sort.${sort}`) }}</option>
        </select>
        <label class="flex items-center gap-2 text-xs text-flixer-muted sm:col-span-1 lg:col-span-2">
          <span class="shrink-0">{{ t('admin.activity.from') }}</span>
          <input type="date" :value="filters.from" :max="filters.to || undefined" :class="fieldClass" @change="setFilters({ from: ($event.target as HTMLInputElement).value })" />
        </label>
        <label class="flex items-center gap-2 text-xs text-flixer-muted sm:col-span-1 lg:col-span-2">
          <span class="shrink-0">{{ t('admin.activity.to') }}</span>
          <input type="date" :value="filters.to" :min="filters.from || undefined" :class="fieldClass" @change="setFilters({ to: ($event.target as HTMLInputElement).value })" />
        </label>
        <div class="flex items-center sm:col-span-2 lg:col-span-2 lg:justify-end">
          <button type="button" :disabled="!hasFilters" class="h-10 rounded border border-flixer-border px-4 text-sm font-semibold transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40" @click="reset">{{ t('admin.activity.reset') }}</button>
        </div>
      </form>

      <AdminSkeleton v-if="loading && !data" variant="table" class="mt-4" />

      <p v-if="error" role="alert" class="mt-4 rounded border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200">{{ error }}</p>

      <div v-if="data" class="mt-4 overflow-hidden rounded border border-flixer-border" :aria-busy="loading">
        <div class="hidden grid-cols-[12rem_1fr_6rem_12rem_9rem] gap-4 border-b border-flixer-border px-5 py-3 text-xs font-semibold uppercase tracking-wide text-flixer-muted md:grid">
          <span>{{ t('admin.activity.columns.user') }}</span>
          <span>{{ t('admin.activity.columns.title') }}</span>
          <span>{{ t('admin.activity.columns.type') }}</span>
          <span>{{ t('admin.activity.columns.progress') }}</span>
          <span class="text-right">{{ t('admin.activity.columns.when') }}</span>
        </div>

        <ul class="divide-y divide-flixer-border transition-opacity" :class="loading && data ? 'opacity-50' : ''">
          <li v-for="(entry, i) in data?.items ?? []" :key="`${entry.at}-${i}`" class="grid gap-x-4 gap-y-2 px-5 py-4 text-sm md:grid-cols-[12rem_1fr_6rem_12rem_9rem] md:items-center">
            <span class="truncate font-semibold">{{ entry.user }}</span>
            <span class="min-w-0 truncate text-flixer-text/90" :title="activityTitle(entry)">{{ activityTitle(entry) }}</span>
            <span class="text-xs text-flixer-muted">{{ t(`admin.activity.type.${entry.type}`) }}</span>
            <span class="flex items-center gap-3">
              <StatusPill v-if="entry.completed" tone="good">{{ t('admin.activity.status.finished') }}</StatusPill>
              <template v-else>
                <span class="h-1.5 w-24 shrink-0 overflow-hidden rounded bg-white/10" role="progressbar" :aria-valuenow="progressPercent(entry)" aria-valuemin="0" aria-valuemax="100">
                  <span class="block h-full rounded bg-linear-to-r from-flixer-primary to-flixer-cyan" :style="{ width: `${progressPercent(entry)}%` }"></span>
                </span>
                <span class="text-xs text-flixer-muted">{{ progressPercent(entry) }}%</span>
              </template>
            </span>
            <span class="text-xs text-flixer-muted md:text-right" :title="absoluteTime(entry.at)">{{ relativeTime(entry.at) }}</span>
          </li>
          <li v-if="!loading && (data?.items.length ?? 0) === 0 && !error" class="px-5 py-12 text-center text-sm text-flixer-muted">{{ hasFilters ? t('admin.activity.noMatches') : t('admin.overview.noActivity') }}</li>
        </ul>
      </div>

      <nav v-if="data && data.total > 0" class="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm" :aria-label="t('admin.activity.pagination')">
        <p class="text-flixer-muted">{{ t('admin.activity.range', { from: rangeStart.toLocaleString(locale), to: rangeEnd.toLocaleString(locale), total: data.total.toLocaleString(locale) }) }}</p>
        <div class="flex items-center gap-2">
          <button type="button" :disabled="filters.page <= 1" class="h-10 rounded border border-flixer-border px-4 font-semibold transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40" @click="setFilters({ page: filters.page - 1 })">{{ t('admin.activity.previous') }}</button>
          <span class="px-2 text-flixer-muted">{{ t('admin.activity.pageOf', { page: filters.page, pages: pageCount }) }}</span>
          <button type="button" :disabled="filters.page >= pageCount" class="h-10 rounded border border-flixer-border px-4 font-semibold transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40" @click="setFilters({ page: filters.page + 1 })">{{ t('admin.activity.next') }}</button>
        </div>
      </nav>
    </AdminSection>
  </div>
</template>
