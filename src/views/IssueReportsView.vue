<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink, useRouter } from 'vue-router'
import { getIssueReport, listIssueReports, type IssueReport } from '../api'
import Header from '../components/header/Header.vue'
import MobileTabBar from '../components/home/MobileTabBar.vue'
import IssueReportForm from '../components/issues/IssueReportForm.vue'
import { useIssueReportsConfig } from '../composables/useIssueReportsConfig'
import { getMobileTabs, getNavLinks } from '../composables/homeNav'
import { describeRequestError } from '../composables/useProfile'
import { useSignOut } from '../composables/useSignOut.ts'
import { catchError } from '../utils/catchError'

const props = defineProps<{ id?: string }>()
const { t } = useI18n()
const router = useRouter()
const { isSigningOut, signOut } = useSignOut()
const { config, load: loadConfig } = useIssueReportsConfig()
const navLinks = computed(getNavLinks)
const tabs = computed(getMobileTabs)
const reports = ref<IssueReport[]>([])
const active = ref<IssueReport | null>(null)
const loading = ref(true)
const error = ref('')
const createOpen = ref(false)

async function load() {
  loading.value = true
  error.value = ''
  try {
    if (props.id) {
      const [failure, report] = await catchError(getIssueReport(props.id))
      if (failure) {
        error.value = describeRequestError(failure)
        active.value = null
      } else {
        active.value = report
      }
    } else {
      active.value = null
      const [failure, value] = await catchError(listIssueReports())
      if (failure) {
        error.value = describeRequestError(failure)
      } else {
        reports.value = value
      }
    }
  } finally {
    loading.value = false
  }
}

function submitted(report: IssueReport) {
  createOpen.value = false
  void router.push({ name: 'issues', params: { id: report.id } })
}

const statusLabel = (status: IssueReport['status']) => t(`issues.status.${status}`)
const dateLabel = (date: string) => new Date(date).toLocaleString()

onMounted(async () => {
  await loadConfig()
  await load()
})
watch(() => props.id, () => void load())
</script>

<template>
  <div class="min-h-screen bg-flixer-background pb-24 font-sans text-flixer-text md:pb-12">
    <Header :links="navLinks" :is-signing-out="isSigningOut" @logout="signOut" />
    <main class="page-gutter mx-auto max-w-5xl pt-28">
      <header class="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold text-white">{{ active ? active.title : t('issues.myReports') }}</h1>
          <p class="mt-1 text-sm text-flixer-muted">{{ active ? t('issues.ticketNumber', { id: active.id.slice(0, 8) }) : t('issues.pageDescription') }}</p>
        </div>
        <RouterLink v-if="active" :to="{ name: 'issues' }" class="rounded border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10">{{ t('issues.backToReports') }}</RouterLink>
        <button v-else-if="config?.enabled" type="button" class="rounded bg-white px-4 py-2 text-sm font-semibold text-flixer-background hover:bg-white/85" @click="createOpen = !createOpen">
          {{ createOpen ? t('common.cancel') : t('issues.newReport') }}
        </button>
      </header>

      <p v-if="error" class="mb-4 rounded border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200" role="alert">{{ error }}</p>
      <p v-if="loading" class="py-12 text-center text-sm text-flixer-muted" role="status">{{ t('issues.loading') }}</p>
      <template v-else-if="active">
        <section class="rounded border border-flixer-border bg-flixer-surface/70 p-5">
          <div class="flex flex-wrap items-center gap-2 text-xs">
            <span class="rounded bg-white/10 px-2 py-1">{{ active.category }}</span>
            <span class="rounded bg-flixer-primary/20 px-2 py-1 text-white">{{ statusLabel(active.status) }}</span>
            <span class="text-flixer-muted">{{ dateLabel(active.createdAt) }}</span>
          </div>
          <p v-if="active.mediaTitle" class="mt-4 text-sm text-flixer-muted">{{ t('issues.aboutMedia', { title: active.mediaTitle }) }}</p>
          <p class="mt-4 whitespace-pre-wrap text-sm leading-6 text-flixer-text">{{ active.description }}</p>
        </section>

        <section class="mt-5 rounded border border-flixer-border bg-flixer-surface/70 p-5">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 class="font-semibold text-white">{{ t('issues.liveChat') }}</h2>
              <p class="mt-1 text-sm text-flixer-muted">{{ active.chatOpen ? t('issues.chatOpenHelp') : t('issues.chatClosedHelp') }}</p>
            </div>
            <RouterLink v-if="active.chatOpen && active.chatConversationId" :to="{ name: 'chat', params: { id: active.chatConversationId } }" class="rounded bg-flixer-primary px-4 py-2 text-sm font-semibold text-white hover:bg-flixer-primary/80">
              {{ t('issues.openChat') }}
            </RouterLink>
          </div>
        </section>

        <section class="mt-5">
          <h2 class="mb-3 text-lg font-semibold text-white">{{ t('issues.updates') }}</h2>
          <ol class="space-y-3">
            <li v-for="update in active.updates ?? []" :key="update.id" class="rounded border border-flixer-border bg-flixer-surface/50 p-4">
              <div class="flex flex-wrap items-center justify-between gap-2 text-xs text-flixer-muted">
                <span>{{ update.author?.displayName ?? t('issues.system') }}</span>
                <time :datetime="update.createdAt">{{ dateLabel(update.createdAt) }}</time>
              </div>
              <p class="mt-2 whitespace-pre-wrap text-sm text-flixer-text">{{ update.body }}</p>
            </li>
          </ol>
        </section>
      </template>
      <template v-else>
        <section v-if="createOpen" class="mb-6 rounded border border-flixer-border bg-flixer-surface/70 p-5">
          <h2 class="mb-4 font-semibold text-white">{{ t('issues.newReport') }}</h2>
          <IssueReportForm @submitted="submitted" />
        </section>
        <p v-if="!config?.enabled" class="rounded border border-flixer-border bg-flixer-surface/50 p-5 text-sm text-flixer-muted">{{ t('issues.disabled') }}</p>
        <ul v-else-if="reports.length" class="divide-y divide-flixer-border overflow-hidden rounded border border-flixer-border bg-flixer-surface/50">
          <li v-for="report in reports" :key="report.id">
            <RouterLink :to="{ name: 'issues', params: { id: report.id } }" class="flex flex-wrap items-center justify-between gap-3 p-4 transition hover:bg-white/5">
              <span class="min-w-0">
                <span class="block truncate font-semibold text-white">{{ report.title }}</span>
                <span class="mt-1 block text-xs text-flixer-muted">{{ report.category }}<template v-if="report.mediaTitle"> · {{ report.mediaTitle }}</template></span>
              </span>
              <span class="flex shrink-0 items-center gap-3 text-xs">
                <span class="rounded bg-white/10 px-2 py-1 text-flixer-text">{{ statusLabel(report.status) }}</span>
                <time class="text-flixer-muted">{{ dateLabel(report.updatedAt) }}</time>
              </span>
            </RouterLink>
          </li>
        </ul>
        <div v-else class="rounded border border-flixer-border bg-flixer-surface/50 p-8 text-center">
          <p class="text-sm text-flixer-muted">{{ t('issues.empty') }}</p>
          <button v-if="config?.enabled" type="button" class="mt-4 rounded bg-white px-4 py-2 text-sm font-semibold text-flixer-background hover:bg-white/85" @click="createOpen = true">{{ t('issues.newReport') }}</button>
        </div>
      </template>
    </main>
    <MobileTabBar :tabs="tabs" />
  </div>
</template>
