<script setup lang="ts">
import { openModal } from '@kolirt/vue-modal'
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { approveMediaRequest, declineMediaRequest, deleteMediaRequest, listMediaRequests, retryMediaRequest, type MediaRequestView, type RequestMediaType, type RequestStatus } from '../api'
import { notify } from '../composables/notify'
import { describeRequestError } from '../composables/useProfile'
import { useProfile } from '../composables/useProfile'
import { useRequestsConfig } from '../composables/useRequestsConfig'
import { useSignOut } from '../composables/useSignOut'
import DeclineRequestModal from '../components/DeclineRequestModal.vue'
import Header from '../components/header/Header.vue'
import MobileTabBar from '../components/home/MobileTabBar.vue'
import { getMobileTabs, getNavLinks } from '../composables/homeNav'
import { catchError } from '../utils/catchError'

const { t } = useI18n()
const { isSigningOut, signOut } = useSignOut()
const config = useRequestsConfig()
const { profile } = useProfile()
const navLinks = computed(getNavLinks)
const tabs = computed(getMobileTabs)
const isAdmin = ref(false)
const scope = ref<'all' | 'mine'>('mine')
const status = ref<RequestStatus | ''>('')
const type = ref<RequestMediaType | ''>('')
const rows = ref<MediaRequestView[]>([])
const total = ref(0)
const counts = ref<Record<RequestStatus, number>>({ pending: 0, approved: 0, declined: 0, failed: 0, available: 0 })
const busy = ref(false)
const limit = 24
const offset = ref(0)
async function load(append = false) {
  busy.value = true
  try {
    const [error, result] = await catchError(listMediaRequests({ scope: scope.value, status: status.value || undefined, type: type.value || undefined, offset: append ? offset.value : 0, limit }))
    if (error) {
      notify.error(describeRequestError(error, t('requests.loadError')))
      return
    }
    rows.value = append ? [...rows.value, ...result.items] : result.items
    total.value = result.total
    counts.value = result.counts
    offset.value = rows.value.length
  } finally {
    busy.value = false
  }
}
async function action(row: MediaRequestView, kind: 'approve' | 'decline' | 'retry' | 'delete') {
  let reason: string | undefined
  if (kind === 'decline') {
    const answer = await openModal<string>(DeclineRequestModal, { props: { title: row.title } }).catch(() => null)
    if (answer === null) return
    reason = answer || undefined
  }
  const operation =
    kind === 'approve' ? approveMediaRequest(row.id).then(() => undefined) :
    kind === 'decline' ? declineMediaRequest(row.id, reason).then(() => undefined) :
    kind === 'retry' ? retryMediaRequest(row.id).then(() => undefined) :
    deleteMediaRequest(row.id).then(() => undefined)
  const [error] = await catchError(operation)
  if (error) {
    notify.error(describeRequestError(error, t('requests.actionError')))
    return
  }
  await load()
}
onMounted(async () => {
  await config.load()
  isAdmin.value = config.config.value?.isAdmin ?? profile.value?.role === 'admin'
  scope.value = isAdmin.value ? 'all' : 'mine'
  await load()
})
watch([scope, status, type], () => {
  void load()
})
</script>

<template>
  <div class="min-h-screen overflow-x-hidden bg-flixer-background pb-28 pt-24 text-flixer-text md:pb-12 md:pt-28">
    <Header :links="navLinks" :is-signing-out="isSigningOut" @logout="signOut" />
    <main class="page-gutter mx-auto max-w-6xl">
      <header class="flex flex-wrap items-end justify-between gap-4 border-b border-flixer-border pb-5">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-flixer-accent">{{ t('requests.title') }}</p>
          <h1 class="mt-1 text-3xl font-bold tracking-tight text-white sm:text-4xl">{{ isAdmin && scope === 'all' ? t('requests.scope.all') : t('requests.scope.mine') }}</h1>
        </div>
        <div v-if="isAdmin" class="inline-flex rounded-xl border border-flixer-border bg-flixer-surface/70 p-1" role="group" :aria-label="t('requests.title')">
          <button v-for="tab in ['all', 'mine'] as const" :key="tab" type="button" class="rounded-lg px-3 py-2 text-xs font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent sm:px-4 sm:text-sm" :class="scope === tab ? 'bg-white text-flixer-background shadow' : 'text-flixer-muted hover:text-white'" :aria-pressed="scope === tab" @click="scope = tab">{{ t(`requests.scope.${tab}`) }}</button>
        </div>
      </header>
      <div class="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="group" :aria-label="t('requests.allStatuses')">
          <button v-for="entry in ['', 'pending', 'approved', 'declined', 'failed', 'available'] as const" :key="entry" type="button" class="inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent" :class="status === entry ? 'border-white bg-white text-flixer-background' : 'border-flixer-border bg-flixer-surface/50 text-flixer-muted hover:border-white/30 hover:text-white'" :aria-pressed="status === entry" @click="status = entry">
            <span>{{ entry ? t(`requests.status.${entry}`) : t('requests.allStatuses') }}</span
            ><span v-if="entry" class="rounded-full px-1.5 py-0.5 text-[10px]" :class="status === entry ? 'bg-black/10' : 'bg-white/10'">{{ counts[entry] }}</span>
          </button>
        </div>
        <label class="sr-only" for="request-type-filter">{{ t('requests.allTypes') }}</label
        ><select id="request-type-filter" v-model="type" class="w-full rounded-xl border border-flixer-border bg-flixer-surface px-3 py-2.5 text-sm text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent sm:w-44">
          <option value="">{{ t('requests.allTypes') }}</option>
          <option value="movie">{{ t('home.itemType.movie') }}</option>
          <option value="tv">{{ t('home.itemType.series') }}</option>
          <option value="music">{{ t('home.itemType.album') }}</option>
        </select>
      </div>

      <div v-if="busy && !rows.length" class="mt-6 space-y-3" role="status" :aria-label="t('common.loading')">
        <div v-for="n in 5" :key="n" class="flex animate-pulse items-center gap-4 rounded-2xl border border-flixer-border bg-flixer-surface/50 p-3 sm:p-4">
          <div class="h-20 w-14 shrink-0 rounded-lg bg-white/[0.08]" />
          <div class="min-w-0 flex-1 space-y-3">
            <div class="h-4 w-2/5 rounded bg-white/[0.08]" />
            <div class="h-3 w-1/3 rounded bg-white/[0.06]" />
          </div>
          <div class="hidden h-8 w-28 rounded bg-white/[0.06] sm:block" />
        </div>
      </div>
      <ul v-else-if="rows.length" class="mt-6 space-y-3">
        <li v-for="row in rows" :key="row.id" class="group rounded-2xl border border-flixer-border bg-flixer-surface/50 p-3 transition hover:border-white/20 hover:bg-flixer-surface/80 sm:p-4">
          <div class="flex flex-wrap items-center gap-3 sm:gap-4">
            <div class="relative h-20 w-14 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-flixer-background sm:h-24 sm:w-16">
              <img v-if="row.poster" :src="row.poster" loading="lazy" :alt="row.title" class="size-full object-cover" />
              <div v-else class="grid size-full place-items-center p-1 text-center text-[10px] text-flixer-muted">{{ row.title }}</div>
              <span class="absolute inset-x-0 bottom-0 h-1" :class="row.status === 'available' ? 'bg-emerald-400' : row.status === 'failed' || row.status === 'declined' ? 'bg-red-400' : row.status === 'approved' ? 'bg-flixer-accent' : 'bg-amber-300'" />
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2">
                <h2 class="truncate text-sm font-semibold text-white sm:text-base">
                  {{ row.title }} <span v-if="row.year" class="font-normal text-flixer-muted">({{ row.year }})</span>
                </h2>
                <span class="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-[10px] font-semibold text-white/80">{{ t(`requests.status.${row.status}`) }}</span>
              </div>
              <p class="mt-1.5 truncate text-xs text-flixer-muted">
                {{ t(`home.itemType.${row.type === 'tv' ? 'series' : row.type === 'music' ? 'album' : 'movie'}`) }} <span aria-hidden="true">·</span> {{ row.serviceName || t('requests.noService') }}<span v-if="isAdmin"> <span aria-hidden="true">·</span> {{ row.requestedBy.displayName || row.requestedBy.username }}</span>
              </p>
              <p v-if="row.declineReason || row.error" class="mt-1 line-clamp-2 text-xs text-red-300">{{ row.declineReason || row.error }}</p>
            </div>
            <div class="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end" role="group" :aria-label="row.title">
              <template v-if="isAdmin && scope === 'all'"
                ><button v-if="row.status === 'pending'" type="button" class="rounded-lg bg-flixer-primary px-3 py-2 text-xs font-semibold text-white transition hover:bg-flixer-primary/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent" @click="action(row, 'approve')">{{ t('requests.actions.approve') }}</button><button v-if="row.status === 'pending'" type="button" class="rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent" @click="action(row, 'decline')">{{ t('requests.actions.decline') }}</button
                ><button v-if="row.status === 'failed'" type="button" class="rounded-lg border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-xs font-semibold text-amber-100 transition hover:bg-amber-300/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent" @click="action(row, 'retry')">{{ t('requests.actions.retry') }}</button></template
              ><button v-if="row.status === 'pending' || isAdmin" type="button" class="rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-flixer-muted transition hover:border-red-300/30 hover:text-red-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent" @click="action(row, 'delete')">{{ t('requests.actions.delete') }}</button>
            </div>
          </div>
        </li>
      </ul>
      <div v-else-if="!busy" class="mt-8 rounded-2xl border border-dashed border-flixer-border bg-flixer-surface/30 px-5 py-14 text-center">
        <div class="mx-auto grid size-12 place-items-center rounded-full bg-white/[0.06] text-flixer-muted" aria-hidden="true">
          <Icon icon="lucide:clipboard-list" class="size-6" aria-hidden="true" />
        </div>
        <p class="mt-4 text-sm font-medium text-white">{{ t('requests.empty') }}</p>
      </div>
      <div v-if="rows.length < total" class="mt-6 flex justify-center">
        <button type="button" class="rounded-xl border border-flixer-border bg-flixer-surface px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent disabled:opacity-50" :disabled="busy" @click="load(true)">{{ busy ? t('common.loading') : t('requests.loadMore') }}</button>
      </div>
    </main>
    <MobileTabBar :tabs="tabs" />
  </div>
</template>

<style scoped>
@reference "../tailwind.css";

.btn {
  @apply rounded border border-white/15 px-3 py-1.5 text-xs text-white hover:bg-white/10;
}
</style>
