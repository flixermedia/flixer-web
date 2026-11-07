<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { AUTH_INVALID_EVENT, AUTH_TOKEN_CHANGED_EVENT, configureLogger, configureLoggerOwner, createLoggerOwnerPairing, discardLoggerPairing, getAccessToken, getLoggerCapacity, getLoggerCapacityPolicy, getLoggerConfiguration, getLoggerCredentials, getLoggerHealth, getLoggerIngestionPolicy, getLoggerOwnerConfiguration, getLoggerOwnerCredentials, getLoggerOwnerPairings, getLoggerPairing, getLoggerQuota, getLoggerRetention, getLoggerStatus, LoggerClient, LoggerRequestError, pairLogger, retryLoggerPairing, revokeLoggerCredential, revokeLoggerOwnerCredential, revokeLoggerOwnerPairing, setLoggerCapacityPolicy, setLoggerIngestionPolicy, setLoggerQuota, setLoggerRetention, type LoggerCapacity, type LoggerCredential, type LoggerDeploymentStatus, type LoggerErrorGroup, type LoggerEvent, type LoggerExporterStatus, type LoggerLevel, type LoggerOwnerCredential, type LoggerOwnerPairing, type LoggerSearch, type LoggerSourceCount } from '../../api'
import { confirmAction } from '../../composables/confirm'
import AdminSection from './AdminSection.vue'
import AnalyticsTrendChart from './AnalyticsTrendChart.vue'
import { aggregateLoggingAnalytics, loggingApplicationCounts, type LoggingAnalytics, type LoggingBucketSize } from './loggingAnalytics'
import { exactLoggingFilters, formatLogTime, loggingFilterFromHash, loggingFilterLink, loggingLevelClass, MAX_CORRELATION_EVENTS, MAX_LOG_EXPORT_EVENTS, mergeCorrelationPage, mergeLiveEvent, parseLoggingFilter, parseSavedLoggingFilters, saveLoggingFilter, serializeLoggingExport, type LoggingFilterPreset, type NamedLoggingFilter } from './loggingFilters'

const { t } = useI18n()
const route = useRoute()
const client = new LoggerClient()
const configured = ref(false)
const endpoint = ref('')
const manageToken = ref('')
const managementExpiry = ref('')
const pairingEndpoint = ref('')
const pairingDeployment = ref('')
const pairingToken = ref('')
const pairingPending = ref(false)
const pairingPendingEndpoint = ref('')
const pairingError = ref('')
const busy = ref(false)
const error = ref('')
const notice = ref('')
const retentionEnabled = ref(false)
const retentionDays = ref(14)
const severityLevels: LoggerLevel[] = ['trace', 'debug', 'info', 'warn', 'error', 'fatal']
const severityDays = ref<Partial<Record<LoggerLevel, number | ''>>>({})
const retentionLoaded = ref(false)
const rate = ref(2000)
const burst = ref(5000)
const credentialRate = ref(0)
const credentialBurst = ref(0)
const serviceRate = ref(0)
const serviceBurst = ref(0)
const serviceLimitEnabled = ref(false)
const rateLoaded = ref(false)
const quotaMaxBytes = ref(0)
const quotaUsedBytes = ref(0)
const quotaLoaded = ref(false)
const ownerToken = ref('')
const ownerConfigured = ref(false)
const ownerError = ref('')
const ownerCapacity = ref<LoggerCapacity | null>(null)
const capacityLoaded = ref(false)
const maxDatabaseBytes = ref(0)
const minFreeBytes = ref(0)
const ownerPairingDeployment = ref('')
const ownerPairingMinutes = ref(10)
const ownerPairingDays = ref(30)
const ownerPairings = ref<LoggerOwnerPairing[]>([])
const ownerPairingsLoaded = ref(false)
const ownerPairingsError = ref('')
const ownerCredentials = ref<LoggerOwnerCredential[]>([])
const ownerCredentialsLoaded = ref(false)
const ownerCredentialsError = ref('')
const issuedPairing = ref<(LoggerOwnerPairing & { token: string; deployment: string }) | null>(null)
const events = ref<LoggerEvent[]>([])
const selected = ref<LoggerEvent | null>(null)
const liveEvents = ref<LoggerEvent[]>([])
const liveSelected = ref<LoggerEvent | null>(null)
const pausedEvents = ref<LoggerEvent[]>([])
const livePaused = ref(false)
const bufferedWhilePaused = ref(0)
const autoScroll = ref(true)
const liveList = ref<HTMLElement | null>(null)
const text = ref('')
const textMode = ref<'all' | 'phrase' | 'substring' | 'regex'>('all')
const app = ref('')
const level = ref('')
const source = ref('')
const instance = ref('')
const eventCode = ref('')
const trace = ref('')
const requestId = ref('')
const task = ref('')
const hours = ref(24)
const savedFilters = ref<NamedLoggingFilter[]>([])
const filterName = ref('')
const selectedFilter = ref('')
const presetError = ref('')
const timeZone = ref<'local' | 'utc'>('local')
const cursor = ref('')
const activeSearch = ref<LoggerSearch | null>(null)
const searching = ref(false)
const correlationKind = ref<'trace' | 'task'>('trace')
const correlationId = ref('')
const correlationQuery = ref<{ kind: 'trace' | 'task'; id: string } | null>(null)
const correlationEvents = ref<LoggerEvent[]>([])
const correlationCursor = ref('')
const correlationSelected = ref<LoggerEvent | null>(null)
const correlationBusy = ref(false)
const correlationError = ref(false)
const analytics = ref<LoggingAnalytics | null>(null)
const analyticsHours = ref(24)
const analyticsBucket = ref<LoggingBucketSize>('hour')
const analyticsBucketKeys: Record<LoggingBucketSize, string> = {
  minute: 'admin.logging.bucketMinute', hour: 'admin.logging.bucketHour', day: 'admin.logging.bucketDay',
}
const appliedAnalytics = ref<{ hours: number; bucket: LoggingBucketSize } | null>(null)
const analyticsStatus = ref<'loading' | 'ready' | 'error'>('loading')
const sourceStats = ref<LoggerSourceCount[]>([])
const applicationStats = ref<{ app: string; count: number }[]>([])
const sourceStatus = ref<'loading' | 'ready' | 'error' | 'tooBroad'>('loading')
const errorGroups = ref<LoggerErrorGroup[]>([])
const groupsError = ref(false)
const health = ref<'unknown' | 'ready' | 'unavailable'>('unknown')
const exporterStatus = ref<LoggerExporterStatus | null>(null)
const deploymentStatus = ref<LoggerDeploymentStatus | null>(null)
const statusError = ref(false)
const credentials = ref<LoggerCredential[]>([])
const credentialsError = ref(false)
const credentialsLoaded = ref(false)
const credentialsBusy = ref(false)
const live = ref(false)
const liveStatus = ref<'stopped' | 'connecting' | 'connected'>('stopped')
const gap = ref(false)
let streamController: AbortController | undefined
let alive = true
let streamGeneration = 0
let sessionGeneration = 0
let statsGeneration = 0
let sourceGeneration = 0
let correlationGeneration = 0
let ownerGeneration = 0
let ownerPairingsGeneration = 0
let ownerCredentialsGeneration = 0
let scrollScheduled = false

const input = 'w-full rounded border border-flixer-border bg-flixer-background px-3 py-2 text-sm'
const button = 'rounded bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/20 disabled:opacity-40'
const summary = computed(() => Object.entries(analytics.value?.totals ?? {}).sort(([a], [b]) => a.localeCompare(b)))
const visibleLiveEvents = computed(() => livePaused.value ? pausedEvents.value : liveEvents.value)

function exportEvents(items: LoggerEvent[], name: string) {
  error.value = ''
  notice.value = ''
  try {
    const url = URL.createObjectURL(new Blob([serializeLoggingExport(items)], { type: 'application/json' }))
    try {
      const link = document.createElement('a')
      link.href = url
      link.download = `flixer-${name}-${new Date().toISOString().slice(0, 10)}.json`
      link.click()
    } finally {
      setTimeout(() => URL.revokeObjectURL(url), 0)
    }
  } catch {
    error.value = t('admin.logging.exportError')
  }
}

async function copyEvent(event: LoggerEvent) {
  const generation = sessionGeneration
  error.value = ''
  notice.value = ''
  try {
    await navigator.clipboard.writeText(JSON.stringify(event, null, 2))
    if (generation === sessionGeneration) notice.value = t('admin.logging.copySuccess')
  } catch {
    if (generation === sessionGeneration) error.value = t('admin.logging.copyError')
  }
}

function currentFilter(): LoggingFilterPreset {
  return parseLoggingFilter({
    app: app.value, level: level.value, source: source.value, instance: instance.value,
    event: eventCode.value, trace: trace.value, request: requestId.value, task: task.value,
    text: text.value, textMode: textMode.value, hours: hours.value,
  })
}

function applyFilter(filter: LoggingFilterPreset) {
  app.value = filter.app
  level.value = filter.level
  source.value = filter.source
  instance.value = filter.instance
  eventCode.value = filter.event
  trace.value = filter.trace
  requestId.value = filter.request
  task.value = filter.task
  text.value = filter.text
  textMode.value = filter.textMode
  hours.value = filter.hours
}

function filterStorageKey() {
  return `flixer.logger.filters:${endpoint.value}`
}

function loadSavedFilters() {
  try {
    savedFilters.value = parseSavedLoggingFilters(localStorage.getItem(filterStorageKey()))
  } catch {
    savedFilters.value = []
    presetError.value = t('admin.logging.filterStorageError')
  }
}

function saveFilter() {
  presetError.value = ''
  try {
    const updated = saveLoggingFilter(savedFilters.value, filterName.value, currentFilter())
    const serialized = JSON.stringify(updated)
    parseSavedLoggingFilters(serialized)
    localStorage.setItem(filterStorageKey(), serialized)
    savedFilters.value = updated
    selectedFilter.value = filterName.value.trim()
    notice.value = t('admin.logging.filterSaved')
  } catch {
    presetError.value = t('admin.logging.filterSaveError')
  }
}

function removeFilter() {
  presetError.value = ''
  try {
    const updated = savedFilters.value.filter((item) => item.name !== selectedFilter.value)
    localStorage.setItem(filterStorageKey(), JSON.stringify(updated))
    savedFilters.value = updated
    selectedFilter.value = ''
  } catch {
    presetError.value = t('admin.logging.filterStorageError')
  }
}

function loadFilter() {
  const found = savedFilters.value.find((item) => item.name === selectedFilter.value)
  if (found) {
    applyFilter(found.filters)
    filterName.value = found.name
  }
}

async function copyFilterLink() {
  const generation = sessionGeneration
  presetError.value = ''
  try {
    await navigator.clipboard.writeText(loggingFilterLink(window.location.href, currentFilter()))
    if (generation === sessionGeneration) notice.value = t('admin.logging.filterLinkCopied')
  } catch {
    if (generation === sessionGeneration) presetError.value = t('admin.logging.filterLinkError')
  }
}

async function loadConfiguration() {
  const generation = sessionGeneration
  busy.value = true
  error.value = ''
  try {
    const [config, pairing] = await Promise.all([getLoggerConfiguration(), getLoggerPairing()])
    if (generation !== sessionGeneration) return
    configured.value = config.configured
    endpoint.value = config.endpoint ?? ''
    managementExpiry.value = config.managementExpiresAt ?? ''
    pairingEndpoint.value = config.endpoint ?? ''
    pairingPending.value = pairing.pending
    pairingPendingEndpoint.value = pairing.endpoint ?? ''
    if (config.configured) {
      loadSavedFilters()
      await Promise.all([loadRetention(), loadRate(), loadQuota(), loadOwner(), loadRecent(), loadStats(), loadSources(), loadHealth(), loadErrorGroups(), loadCredentials()])
    }
  } catch {
    if (generation === sessionGeneration) error.value = t('admin.logging.loadError')
  } finally {
    if (generation === sessionGeneration) busy.value = false
  }
}

async function submitPairing(retry: boolean) {
  let generation = sessionGeneration
  busy.value = true
  pairingError.value = ''
  notice.value = ''
  try {
    const config = retry
      ? await retryLoggerPairing()
      : await pairLogger(pairingEndpoint.value.trim(), pairingDeployment.value, pairingToken.value)
    if (generation !== sessionGeneration) return
    clearSession()
    generation = sessionGeneration
    busy.value = true
    configured.value = config.configured
    endpoint.value = config.endpoint ?? ''
    managementExpiry.value = config.managementExpiresAt ?? ''
    pairingEndpoint.value = config.endpoint ?? ''
    loadSavedFilters()
    notice.value = t('admin.logging.pairingSaved')
    await Promise.all([loadRetention(), loadRate(), loadQuota(), loadOwner(), loadRecent(), loadStats(), loadSources(), loadHealth(), loadErrorGroups(), loadCredentials()])
  } catch {
    if (generation !== sessionGeneration) return
    pairingError.value = t('admin.logging.pairingError')
    try {
      const pairing = await getLoggerPairing()
      if (generation !== sessionGeneration) return
      pairingPending.value = pairing.pending
      pairingPendingEndpoint.value = pairing.endpoint ?? ''
    } catch {
      if (generation === sessionGeneration) pairingError.value = t('admin.logging.pairingStatusError')
    }
  } finally {
    if (generation === sessionGeneration) {
      pairingToken.value = ''
      busy.value = false
    }
  }
}

async function discardPendingPairing() {
  const generation = sessionGeneration
  const confirmed = await confirmAction(t('admin.logging.confirmDiscardPairing'), { danger: true, confirmLabel: t('admin.logging.discardPairingAction') })
  if (!confirmed || generation !== sessionGeneration) return
  busy.value = true
  pairingError.value = ''
  try {
    await discardLoggerPairing()
    if (generation !== sessionGeneration) return
    pairingPending.value = false
    pairingPendingEndpoint.value = ''
    notice.value = t('admin.logging.pairingDiscarded')
  } catch {
    if (generation === sessionGeneration) pairingError.value = t('admin.logging.pairingDiscardError')
  } finally {
    if (generation === sessionGeneration) busy.value = false
  }
}

async function saveConfiguration() {
  let generation = sessionGeneration
  busy.value = true
  error.value = ''
  notice.value = ''
  try {
    const config = await configureLogger(endpoint.value.trim(), manageToken.value)
    if (generation !== sessionGeneration) return
    clearSession()
    generation = sessionGeneration
    busy.value = true
    configured.value = config.configured
    endpoint.value = config.endpoint ?? ''
    loadSavedFilters()
    notice.value = t('admin.logging.saved')
    await Promise.all([loadRetention(), loadRate(), loadQuota(), loadOwner(), loadRecent(), loadStats(), loadSources(), loadHealth(), loadErrorGroups(), loadCredentials()])
  } catch {
    if (generation === sessionGeneration) error.value = t('admin.logging.saveError')
  } finally {
    if (generation === sessionGeneration) busy.value = false
  }
}

async function loadRetention() {
  const generation = sessionGeneration
  retentionLoaded.value = false
  try {
    const policy = await getLoggerRetention()
    if (generation !== sessionGeneration) return
    retentionEnabled.value = policy.enabled
    retentionDays.value = policy.days || 14
    severityDays.value = { ...policy.severityDays }
    retentionLoaded.value = true
  } catch {
    if (generation === sessionGeneration) error.value = t('admin.logging.loadError')
  }
}

async function loadRate() {
  const generation = sessionGeneration
  rateLoaded.value = false
  try {
    const policy = await getLoggerIngestionPolicy()
    if (generation !== sessionGeneration) return
    rate.value = policy.eventsPerSecond
    burst.value = policy.burst
    credentialRate.value = policy.credentialEventsPerSecond ?? 0
    credentialBurst.value = policy.credentialBurst ?? 0
    serviceRate.value = policy.serviceEventsPerSecond ?? 0
    serviceBurst.value = policy.serviceBurst ?? 0
    serviceLimitEnabled.value = serviceRate.value > 0
    rateLoaded.value = true
  } catch {
    if (generation === sessionGeneration) error.value = t('admin.logging.rateLoadError')
  }
}

async function loadQuota() {
  const generation = sessionGeneration
  quotaLoaded.value = false
  try {
    const policy = await getLoggerQuota()
    if (generation !== sessionGeneration) return
    quotaMaxBytes.value = policy.maxBytes
    quotaUsedBytes.value = policy.usedBytes
    quotaLoaded.value = true
  } catch {
    if (generation === sessionGeneration) error.value = t('admin.logging.quotaLoadError')
  }
}

async function loadOwner() {
  const generation = sessionGeneration
  const loadGeneration = ++ownerGeneration
  const isCurrent = () => generation === sessionGeneration && loadGeneration === ownerGeneration
  ownerError.value = ''
  capacityLoaded.value = false
  ownerCapacity.value = null
  try {
    const config = await getLoggerOwnerConfiguration()
    if (!isCurrent()) return
    ownerConfigured.value = config.configured
    if (!config.configured) {
      ownerCapacity.value = null
      return
    }
    const [capacity, policy] = await Promise.all([getLoggerCapacity(), getLoggerCapacityPolicy()])
    if (!isCurrent()) return
    ownerCapacity.value = capacity
    maxDatabaseBytes.value = policy.maxDatabaseBytes
    minFreeBytes.value = policy.minFreeBytes
    capacityLoaded.value = true
  } catch {
    if (isCurrent()) ownerError.value = t('admin.logging.ownerLoadError')
  }
}

async function saveOwner() {
  const generation = sessionGeneration
  ++ownerGeneration
  busy.value = true
  ownerError.value = ''
  notice.value = ''
  try {
    await configureLoggerOwner(ownerToken.value)
    if (generation !== sessionGeneration) return
    ownerToken.value = ''
    notice.value = t('admin.logging.ownerSaved')
    await loadOwner()
  } catch {
    if (generation === sessionGeneration) ownerError.value = t('admin.logging.ownerSaveError')
  } finally {
    if (generation === sessionGeneration) {
      ownerToken.value = ''
      busy.value = false
    }
  }
}

async function saveCapacity() {
  const generation = sessionGeneration
  const requestedPolicy = { maxDatabaseBytes: maxDatabaseBytes.value, minFreeBytes: minFreeBytes.value }
  const confirmed = await confirmAction(t('admin.logging.confirmCapacity'), { danger: true, confirmLabel: t('admin.logging.confirmCapacityAction') })
  if (!confirmed || generation !== sessionGeneration) return
  busy.value = true
  ++ownerGeneration
  ownerError.value = ''
  notice.value = ''
  try {
    const policy = await setLoggerCapacityPolicy(requestedPolicy)
    if (generation !== sessionGeneration) return
    maxDatabaseBytes.value = policy.maxDatabaseBytes
    minFreeBytes.value = policy.minFreeBytes
    notice.value = t('admin.logging.capacitySaved')
    await loadOwner()
  } catch {
    if (generation === sessionGeneration) ownerError.value = t('admin.logging.capacitySaveError')
  } finally {
    if (generation === sessionGeneration) busy.value = false
  }
}

async function loadOwnerPairings() {
  const generation = sessionGeneration
  const loadGeneration = ++ownerPairingsGeneration
  const deployment = ownerPairingDeployment.value
  ownerPairingsError.value = ''
  ownerPairingsLoaded.value = false
  try {
    const pairings = await getLoggerOwnerPairings(deployment)
    if (generation !== sessionGeneration || loadGeneration !== ownerPairingsGeneration || deployment !== ownerPairingDeployment.value) return
    ownerPairings.value = pairings
    ownerPairingsLoaded.value = true
  } catch {
    if (generation === sessionGeneration && loadGeneration === ownerPairingsGeneration) ownerPairingsError.value = t('admin.logging.ownerPairingsLoadError')
  }
}

async function loadOwnerCredentials() {
  const generation = sessionGeneration
  const loadGeneration = ++ownerCredentialsGeneration
  const deployment = ownerPairingDeployment.value
  ownerCredentialsError.value = ''
  ownerCredentialsLoaded.value = false
  try {
    const credentials = await getLoggerOwnerCredentials(deployment)
    if (generation !== sessionGeneration || loadGeneration !== ownerCredentialsGeneration || deployment !== ownerPairingDeployment.value) return
    ownerCredentials.value = credentials
    ownerCredentialsLoaded.value = true
  } catch {
    if (generation === sessionGeneration && loadGeneration === ownerCredentialsGeneration) ownerCredentialsError.value = t('admin.logging.ownerCredentialsLoadError')
  }
}

async function revokeOwnerManagement(credential: LoggerOwnerCredential) {
  const generation = sessionGeneration
  const deployment = ownerPairingDeployment.value
  const confirmed = await confirmAction(t('admin.logging.confirmOwnerCredentialRevoke'), { danger: true, confirmLabel: t('admin.logging.revoke') })
  if (!confirmed || generation !== sessionGeneration || deployment !== ownerPairingDeployment.value) return
  busy.value = true
  ownerCredentialsError.value = ''
  try {
    await revokeLoggerOwnerCredential(deployment, credential.id)
    if (generation === sessionGeneration && deployment === ownerPairingDeployment.value) await loadOwnerCredentials()
  } catch {
    if (generation === sessionGeneration && deployment === ownerPairingDeployment.value) ownerCredentialsError.value = t('admin.logging.ownerCredentialRevokeError')
  } finally {
    if (generation === sessionGeneration) busy.value = false
  }
}

async function issueOwnerPairing() {
  const generation = sessionGeneration
  const deployment = ownerPairingDeployment.value
  const minutes = ownerPairingMinutes.value
  const days = ownerPairingDays.value
  const confirmed = await confirmAction(t('admin.logging.confirmOwnerPairing'), { danger: true, confirmLabel: t('admin.logging.confirmOwnerPairingAction') })
  if (!confirmed || generation !== sessionGeneration) return
  busy.value = true
  ownerPairingsError.value = ''
  try {
    const pairing = await createLoggerOwnerPairing(deployment, minutes, days)
    if (generation !== sessionGeneration) return
    issuedPairing.value = { ...pairing, deployment }
    if (deployment === ownerPairingDeployment.value) await loadOwnerPairings()
  } catch {
    if (generation === sessionGeneration) ownerPairingsError.value = t('admin.logging.ownerPairingIssueError')
  } finally {
    if (generation === sessionGeneration) busy.value = false
  }
}

async function revokeOwnerPairing(pairing: LoggerOwnerPairing) {
  const generation = sessionGeneration
  const deployment = ownerPairingDeployment.value
  const confirmed = await confirmAction(t('admin.logging.confirmOwnerPairingRevoke'), { danger: true, confirmLabel: t('admin.logging.revoke') })
  if (!confirmed || generation !== sessionGeneration) return
  busy.value = true
  ownerPairingsError.value = ''
  try {
    await revokeLoggerOwnerPairing(deployment, pairing.id)
    if (generation !== sessionGeneration) return
    if (issuedPairing.value?.id === pairing.id) issuedPairing.value = null
    if (deployment === ownerPairingDeployment.value) await loadOwnerPairings()
  } catch {
    if (generation === sessionGeneration) ownerPairingsError.value = t('admin.logging.ownerPairingRevokeError')
  } finally {
    if (generation === sessionGeneration) busy.value = false
  }
}

async function copyOwnerPairing() {
  if (!issuedPairing.value) return
  const generation = sessionGeneration
  try {
    await navigator.clipboard.writeText(issuedPairing.value.token)
    if (generation === sessionGeneration) notice.value = t('admin.logging.ownerPairingCopied')
  } catch {
    if (generation === sessionGeneration) ownerPairingsError.value = t('admin.logging.copyError')
  }
}

async function saveQuota() {
  const generation = sessionGeneration
  busy.value = true
  error.value = ''
  notice.value = ''
  try {
    const policy = await setLoggerQuota(quotaMaxBytes.value)
    if (generation !== sessionGeneration) return
    quotaMaxBytes.value = policy.maxBytes
    quotaUsedBytes.value = policy.usedBytes
    notice.value = t('admin.logging.quotaSaved')
  } catch {
    if (generation === sessionGeneration) error.value = t('admin.logging.quotaSaveError')
  } finally {
    if (generation === sessionGeneration) busy.value = false
  }
}

async function saveRate() {
  const generation = sessionGeneration
  busy.value = true
  error.value = ''
  notice.value = ''
  try {
    if (serviceRate.value > 0 && !serviceLimitEnabled.value) {
      const confirmed = await confirmAction(t('admin.logging.confirmServiceLimit'), {
        danger: true, confirmLabel: t('admin.logging.enableServiceLimit'),
      })
      if (!confirmed || generation !== sessionGeneration) return
    }
    const policy = await setLoggerIngestionPolicy({
      eventsPerSecond: rate.value,
      burst: burst.value,
      ...(credentialRate.value === 0 && credentialBurst.value === 0 ? {} : {
        credentialEventsPerSecond: credentialRate.value,
        credentialBurst: credentialBurst.value,
      }),
      ...(serviceRate.value === 0 && serviceBurst.value === 0 ? {} : {
        serviceEventsPerSecond: serviceRate.value,
        serviceBurst: serviceBurst.value,
      }),
    })
    if (generation !== sessionGeneration) return
    rate.value = policy.eventsPerSecond
    burst.value = policy.burst
    credentialRate.value = policy.credentialEventsPerSecond ?? 0
    credentialBurst.value = policy.credentialBurst ?? 0
    serviceRate.value = policy.serviceEventsPerSecond ?? 0
    serviceBurst.value = policy.serviceBurst ?? 0
    serviceLimitEnabled.value = serviceRate.value > 0
    notice.value = t('admin.logging.rateSaved')
  } catch {
    if (generation === sessionGeneration) error.value = t('admin.logging.rateSaveError')
  } finally {
    if (generation === sessionGeneration) busy.value = false
  }
}

async function saveRetention() {
  const generation = sessionGeneration
  busy.value = true
  error.value = ''
  notice.value = ''
  try {
    const overrides = Object.fromEntries(Object.entries(severityDays.value).filter(([, days]) => typeof days === 'number' && days !== 0))
    const policy = await setLoggerRetention({ enabled: retentionEnabled.value, days: retentionDays.value, severityDays: overrides })
    if (generation !== sessionGeneration) return
    retentionEnabled.value = policy.enabled
    retentionDays.value = policy.days || 14
    severityDays.value = { ...policy.severityDays }
    notice.value = t('admin.logging.retentionSaved')
  } catch {
    if (generation === sessionGeneration) error.value = t('admin.logging.retentionError')
  } finally {
    if (generation === sessionGeneration) busy.value = false
  }
}

async function loadStats() {
  const generation = sessionGeneration
  const request = ++statsGeneration
  const end = Math.floor(Date.now() / 60_000) * 60_000
  const selectedHours = analyticsHours.value
  const start = end - selectedHours * 60 * 60_000
  const bucket = analyticsBucket.value
  analytics.value = null
  appliedAnalytics.value = null
  analyticsStatus.value = 'loading'
  try {
    const buckets = await client.stats(new Date(start).toISOString(), new Date(end).toISOString())
    if (generation !== sessionGeneration || request !== statsGeneration) return
    analytics.value = aggregateLoggingAnalytics(buckets, start, end, bucket)
    appliedAnalytics.value = { hours: selectedHours, bucket }
    analyticsStatus.value = 'ready'
  } catch {
    if (generation === sessionGeneration && request === statsGeneration) analyticsStatus.value = 'error'
  }
}

function changeAnalyticsWindow() {
  if (analyticsHours.value > 24 && analyticsBucket.value === 'minute') analyticsBucket.value = 'hour'
}

async function loadSources() {
  const generation = sessionGeneration
  const request = ++sourceGeneration
  const end = Math.floor(Date.now() / 60_000) * 60_000
  const start = end - 24 * 60 * 60_000
  sourceStats.value = []
  applicationStats.value = []
  sourceStatus.value = 'loading'
  try {
    const sources = await client.sources(new Date(start).toISOString(), new Date(end).toISOString())
    if (generation !== sessionGeneration || request !== sourceGeneration) return
    applicationStats.value = loggingApplicationCounts(sources)
    sourceStats.value = sources
    sourceStatus.value = 'ready'
  } catch (reason) {
    if (generation === sessionGeneration && request === sourceGeneration) {
      sourceStatus.value = reason instanceof LoggerRequestError && reason.status === 422 ? 'tooBroad' : 'error'
    }
  }
}

async function loadHealth() {
  const generation = sessionGeneration
  deploymentStatus.value = null
  statusError.value = false
  try {
    const result = await getLoggerHealth()
    if (generation !== sessionGeneration) return
    exporterStatus.value = result.exporter
    health.value = result.status
  } catch {
    if (generation !== sessionGeneration) return
    exporterStatus.value = null
    deploymentStatus.value = null
    health.value = 'unavailable'
    return
  }
  if (health.value === 'ready') {
    try {
      const result = await getLoggerStatus()
      if (generation === sessionGeneration) deploymentStatus.value = result
    } catch {
      if (generation === sessionGeneration) statusError.value = true
    }
  }
}

async function loadCredentials() {
  const generation = sessionGeneration
  credentialsError.value = false
  try {
    const result = await getLoggerCredentials()
    if (generation !== sessionGeneration) return
    credentials.value = result
    credentialsLoaded.value = true
  } catch {
    if (generation !== sessionGeneration) return
    credentialsError.value = true
    credentialsLoaded.value = false
    credentials.value = []
  }
}

async function revokeCredential(credential: LoggerCredential) {
  const generation = sessionGeneration
  if (credentialsBusy.value || !(await confirmAction(t('admin.logging.confirmRevoke', { scope: credential.scope, id: credential.id }), { danger: true })) || generation !== sessionGeneration) return
  credentialsBusy.value = true
  try {
    await revokeLoggerCredential(credential.id)
    if (generation === sessionGeneration) await loadCredentials()
  } catch {
    if (generation === sessionGeneration) credentialsError.value = true
  } finally {
    if (generation === sessionGeneration) credentialsBusy.value = false
  }
}

async function loadErrorGroups() {
  const generation = sessionGeneration
  const end = Date.now()
  groupsError.value = false
  try {
    const groups = await client.errorGroups(new Date(end - 24 * 60 * 60_000).toISOString(), new Date(end).toISOString())
    if (generation === sessionGeneration) errorGroups.value = groups
  } catch {
    if (generation === sessionGeneration) groupsError.value = true
  }
}

async function loadRecent() {
  const generation = sessionGeneration
  searching.value = true
  error.value = ''
  activeSearch.value = null
  cursor.value = ''
  try {
    const result = await client.recent()
    if (generation === sessionGeneration) events.value = result
  } catch {
    if (generation === sessionGeneration) error.value = t('admin.logging.queryError')
  } finally {
    if (generation === sessionGeneration) searching.value = false
  }
}

async function search(next = false) {
  if (searching.value) return
  const generation = sessionGeneration
  searching.value = true
  error.value = ''
  try {
    let request = activeSearch.value
    if (!next) {
      const fields = exactLoggingFilters({
        app: app.value, level: level.value, source: source.value, instance: instance.value,
        event: eventCode.value, trace: trace.value, request: requestId.value, task: task.value,
      })
      const end = new Date()
      const searchText = textMode.value === 'regex' ? text.value : text.value.trim()
      request = {
        start: new Date(end.getTime() - hours.value * 60 * 60_000).toISOString(),
        end: end.toISOString(), limit: 100,
        ...(Object.keys(fields).length ? { fields } : {}),
        ...(searchText ? { text: searchText, text_mode: textMode.value } : {}),
      }
      activeSearch.value = request
      cursor.value = ''
    }
    if (!request || (next && !cursor.value)) return
    const result = await client.search({ ...request, ...(next ? { cursor: cursor.value } : {}) })
    if (generation !== sessionGeneration) return
    events.value = next ? [...events.value, ...result.events] : result.events
    cursor.value = result.next_cursor
  } catch (reason) {
    if (generation === sessionGeneration) error.value = t(
      reason instanceof LoggerRequestError && reason.status === 422 ? 'admin.logging.searchTooBroad'
        : reason instanceof LoggerRequestError && reason.status === 400 && activeSearch.value?.text_mode === 'regex' ? 'admin.logging.regexSearchError'
          : 'admin.logging.searchError',
    )
  } finally {
    if (generation === sessionGeneration) searching.value = false
  }
}

function clearCorrelation() {
  correlationGeneration++
  correlationId.value = ''
  correlationQuery.value = null
  correlationEvents.value = []
  correlationCursor.value = ''
  correlationSelected.value = null
  correlationBusy.value = false
  correlationError.value = false
}

async function loadCorrelation(next = false) {
  if (next && (correlationBusy.value || !correlationQuery.value || !correlationCursor.value)) return
  const query = next ? correlationQuery.value : { kind: correlationKind.value, id: correlationId.value.trim() }
  if (!query || !query.id) return
  const generation = ++correlationGeneration
  const session = sessionGeneration
  const pageCursor = next ? correlationCursor.value : undefined
  if (!next) {
    correlationQuery.value = query
    correlationEvents.value = []
    correlationCursor.value = ''
    correlationSelected.value = null
  }
  correlationBusy.value = true
  correlationError.value = false
  try {
    const result = await client.correlation(query.kind, query.id, pageCursor)
    if (generation !== correlationGeneration || session !== sessionGeneration) return
    correlationEvents.value = mergeCorrelationPage(correlationEvents.value, result.events)
    correlationCursor.value = result.next_cursor
  } catch {
    if (generation === correlationGeneration && session === sessionGeneration) correlationError.value = true
  } finally {
    if (generation === correlationGeneration && session === sessionGeneration) correlationBusy.value = false
  }
}

function inspectCorrelation(kind: 'trace' | 'task', id: string) {
  correlationKind.value = kind
  correlationId.value = id
  void loadCorrelation()
  document.getElementById('logger-correlation')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function stopLive() {
  live.value = false
  streamGeneration++
  streamController?.abort()
  streamController = undefined
  liveStatus.value = 'stopped'
  livePaused.value = false
  pausedEvents.value = []
  bufferedWhilePaused.value = 0
}

function toggleLivePause() {
  if (livePaused.value) {
    livePaused.value = false
    pausedEvents.value = []
    bufferedWhilePaused.value = 0
    scheduleLiveScroll()
  } else {
    pausedEvents.value = [...liveEvents.value]
    livePaused.value = true
  }
}

function scheduleLiveScroll() {
  if (!autoScroll.value || livePaused.value || scrollScheduled) return
  scrollScheduled = true
  const generation = streamGeneration
  void nextTick(() => {
    scrollScheduled = false
    if (generation === streamGeneration && !livePaused.value && autoScroll.value) liveList.value?.scrollTo({ top: 0 })
  })
}

async function startLive() {
  stopLive()
  live.value = true
  gap.value = false
  liveEvents.value = []
  liveSelected.value = null
  const filters = exactLoggingFilters({
    app: app.value, level: level.value, source: source.value, instance: instance.value,
    event: eventCode.value, trace: trace.value, request: requestId.value, task: task.value,
  })
  const generation = streamGeneration
  let retry = 1000
  let liveCursor: string | undefined
  while (alive && live.value && generation === streamGeneration) {
    streamController = new AbortController()
    const controller = streamController
    liveStatus.value = 'connecting'
    try {
      await client.stream(controller.signal, (event, nextCursor) => {
        if (generation !== streamGeneration) return
        liveCursor = nextCursor
        liveStatus.value = 'connected'
        retry = 1000
        const isNew = !liveEvents.value.some((existing) => existing.event_id === event.event_id)
        const next = mergeLiveEvent(liveEvents.value, event)
        if (next.overflow) gap.value = true
        liveEvents.value = next.events
        if (livePaused.value && isNew) bufferedWhilePaused.value = Math.min(bufferedWhilePaused.value + 1, 1_000_000_000)
        scheduleLiveScroll()
      }, () => { if (!liveCursor) gap.value = true }, () => { if (generation === streamGeneration) liveStatus.value = 'connected' }, liveCursor, filters)
    } catch (reason) {
      if (controller.signal.aborted) break
      if (reason instanceof LoggerRequestError && (reason.status === 400 || reason.status === 410) && liveCursor) {
        liveCursor = undefined
        gap.value = true
      }
    }
    if (!alive || !live.value || generation !== streamGeneration) break
    if (!liveCursor) gap.value = true
    liveStatus.value = 'connecting'
    await new Promise<void>((resolve) => {
      const timer = setTimeout(resolve, retry)
      controller.signal.addEventListener('abort', () => { clearTimeout(timer); resolve() }, { once: true })
    })
    retry = Math.min(retry * 2, 30_000)
  }
}

function clearSession() {
  sessionGeneration++
  stopLive()
  client.clear()
  clearCorrelation()
  configured.value = false
  endpoint.value = ''
  manageToken.value = ''
  managementExpiry.value = ''
  pairingEndpoint.value = ''
  pairingDeployment.value = ''
  pairingToken.value = ''
  pairingPending.value = false
  pairingPendingEndpoint.value = ''
  pairingError.value = ''
  busy.value = false
  searching.value = false
  error.value = ''
  notice.value = ''
  cursor.value = ''
  activeSearch.value = null
  events.value = []
  selected.value = null
  liveEvents.value = []
  liveSelected.value = null
  analytics.value = null
  appliedAnalytics.value = null
  analyticsStatus.value = 'loading'
  sourceStats.value = []
  applicationStats.value = []
  sourceStatus.value = 'loading'
  errorGroups.value = []
  exporterStatus.value = null
  health.value = 'unknown'
  deploymentStatus.value = null
  statusError.value = false
  credentials.value = []
  credentialsBusy.value = false
  credentialsLoaded.value = false
  credentialsError.value = false
  retentionLoaded.value = false
  severityDays.value = {}
  rateLoaded.value = false
  serviceLimitEnabled.value = false
  quotaLoaded.value = false
  quotaMaxBytes.value = 0
  quotaUsedBytes.value = 0
  ownerToken.value = ''
  ownerConfigured.value = false
  ownerError.value = ''
  ownerCapacity.value = null
  capacityLoaded.value = false
  maxDatabaseBytes.value = 0
  minFreeBytes.value = 0
  ownerPairingDeployment.value = ''
  ownerPairingMinutes.value = 10
  ownerPairingDays.value = 30
  ownerPairings.value = []
  ownerPairingsLoaded.value = false
  ownerPairingsError.value = ''
  ownerCredentials.value = []
  ownerCredentialsLoaded.value = false
  ownerCredentialsError.value = ''
  issuedPairing.value = null
  ownerPairingsGeneration++
  ownerCredentialsGeneration++
  savedFilters.value = []
  selectedFilter.value = ''
  filterName.value = ''
  presetError.value = ''
  applyFilter({ app: '', level: '', source: '', instance: '', event: '', trace: '', request: '', task: '', text: '', textMode: 'all', hours: 24 })
  gap.value = false
  groupsError.value = false
}

function handleTokenChange() {
  clearSession()
  if (alive && getAccessToken()) void loadConfiguration()
}

function loadSharedFilter() {
  try {
    const filter = loggingFilterFromHash(window.location.hash)
    if (filter) {
      presetError.value = ''
      applyFilter(filter)
    }
  } catch {
    presetError.value = t('admin.logging.filterLinkInvalid')
  }
}

watch(ownerPairingDeployment, () => {
  ownerPairingsGeneration++
  ownerPairings.value = []
  ownerPairingsLoaded.value = false
  ownerCredentialsGeneration++
  ownerCredentials.value = []
  ownerCredentialsLoaded.value = false
  ownerCredentialsError.value = ''
})
watch(() => route.hash, loadSharedFilter)
onMounted(() => {
  loadSharedFilter()
  window.addEventListener(AUTH_INVALID_EVENT, clearSession)
  window.addEventListener(AUTH_TOKEN_CHANGED_EVENT, handleTokenChange)
  void loadConfiguration()
})
onBeforeUnmount(() => {
  alive = false
  window.removeEventListener(AUTH_INVALID_EVENT, clearSession)
  window.removeEventListener(AUTH_TOKEN_CHANGED_EVENT, handleTokenChange)
  clearSession()
})
</script>

<template>
  <div class="space-y-6">
    <p class="rounded border border-amber-500/40 bg-amber-500/10 p-3 text-sm">{{ t('admin.logging.experimental') }}</p>
    <p v-if="error" role="alert" class="rounded bg-red-500/10 p-3 text-sm text-red-300">{{ error }}</p>
    <p v-if="notice" role="status" class="rounded bg-green-500/10 p-3 text-sm">{{ notice }}</p>

    <AdminSection :title="t('admin.logging.configuration')" :description="t('admin.logging.configurationHelp')">
      <form class="grid gap-3 md:grid-cols-2" @submit.prevent="saveConfiguration">
        <label class="text-sm">{{ t('admin.logging.endpoint') }}<input v-model="endpoint" :class="input" type="url" required autocomplete="url" /></label>
        <label class="text-sm">{{ t('admin.logging.manageToken') }}<input v-model="manageToken" :class="input" type="password" required autocomplete="new-password" /></label>
        <div><button :class="button" :disabled="busy" type="submit">{{ t('admin.logging.saveConfiguration') }}</button></div>
      </form>
      <p v-if="managementExpiry" class="mt-3 text-sm text-amber-300">{{ t('admin.logging.managementExpiry', { time: new Date(managementExpiry).toLocaleString() }) }}</p>
    </AdminSection>

    <AdminSection :title="t('admin.logging.pairingTitle')" :description="t('admin.logging.pairingHelp')">
      <p v-if="pairingError" role="alert" class="mb-3 text-sm text-amber-300">{{ pairingError }}</p>
      <div v-if="pairingPending" class="mb-4 flex flex-wrap items-center gap-3">
        <p class="text-sm text-amber-300">{{ t('admin.logging.pairingPending', { endpoint: pairingPendingEndpoint }) }}</p>
        <button :class="button" type="button" :disabled="busy" @click="submitPairing(true)">{{ t('admin.logging.pairingRetry') }}</button>
        <button :class="button" type="button" :disabled="busy" @click="discardPendingPairing">{{ t('admin.logging.discardPairing') }}</button>
      </div>
      <form class="grid gap-3 md:grid-cols-3" @submit.prevent="submitPairing(false)">
        <label class="text-sm">{{ t('admin.logging.endpoint') }}<input v-model="pairingEndpoint" :class="input" type="url" required autocomplete="url" /></label>
        <label class="text-sm">{{ t('admin.logging.pairingDeployment') }}<input v-model="pairingDeployment" :class="input" maxlength="128" required autocomplete="off" /></label>
        <label class="text-sm">{{ t('admin.logging.pairingToken') }}<input v-model="pairingToken" :class="input" type="password" minlength="43" maxlength="43" required autocomplete="new-password" /></label>
        <div><button :class="button" :disabled="busy || pairingPending" type="submit">{{ t('admin.logging.pairingConnect') }}</button></div>
      </form>
    </AdminSection>

    <template v-if="configured">
      <AdminSection :title="t('admin.logging.health')">
        <p role="status" class="text-sm">{{ t(`admin.logging.health_${health}`) }}</p>
        <p v-if="exporterStatus" class="mt-2 text-sm text-flixer-muted">{{ t('admin.logging.exporterStatus', { queued: exporterStatus.queued, dropped: exporterStatus.dropped }) }}</p>
        <p v-if="exporterStatus?.circuitOpenUntil" role="status" class="mt-2 text-sm text-amber-300">{{ t('admin.logging.circuitOpen', { until: new Date(exporterStatus.circuitOpenUntil).toLocaleTimeString() }) }}</p>
        <p v-if="deploymentStatus" class="mt-2 text-sm text-flixer-muted">{{ t('admin.logging.lastIngest', { time: deploymentStatus.last_ingested_at ? new Date(deploymentStatus.last_ingested_at).toLocaleString() : t('admin.logging.never') }) }}</p>
        <p v-if="deploymentStatus" class="mt-2 text-sm text-flixer-muted">{{ t('admin.logging.capacity', { streams: deploymentStatus.live_subscribers, ingests: deploymentStatus.active_ingestions, maxIngests: deploymentStatus.max_ingestions, queries: deploymentStatus.active_queries, maxQueries: deploymentStatus.max_queries }) }}</p>
        <p v-if="deploymentStatus?.retention" role="status" class="mt-2 text-sm" :class="deploymentStatus.retention.failed ? 'text-amber-300' : 'text-flixer-muted'">{{ t(deploymentStatus.retention.failed ? 'admin.logging.retentionSweepFailed' : 'admin.logging.retentionSweep', { time: new Date(deploymentStatus.retention.completed_at).toLocaleString(), count: deploymentStatus.retention.deleted }) }}</p>
        <p v-if="deploymentStatus?.retention?.batch_full" class="mt-2 text-sm text-flixer-muted">{{ t('admin.logging.retentionBatchFull') }}</p>
        <p v-if="statusError" role="status" class="mt-2 text-sm text-amber-300">{{ t('admin.logging.statusError') }}</p>
        <button :class="button" class="mt-3" type="button" @click="loadHealth">{{ t('admin.logging.refresh') }}</button>
      </AdminSection>
      <AdminSection :title="t('admin.logging.retention')" :description="t('admin.logging.retentionHelp')">
        <form class="space-y-4" @submit.prevent="saveRetention">
          <div class="flex flex-wrap items-end gap-4">
            <label class="flex items-center gap-2 text-sm"><input v-model="retentionEnabled" type="checkbox" :disabled="!retentionLoaded" />{{ t('admin.logging.enableRetention') }}</label>
            <label class="text-sm">{{ t('admin.logging.days') }}<input v-model.number="retentionDays" :class="input" type="number" min="1" max="3650" required :disabled="!retentionLoaded" /></label>
          </div>
          <fieldset :disabled="!retentionLoaded">
            <legend class="mb-2 text-sm">{{ t('admin.logging.severityRetentionHelp') }}</legend>
            <div class="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <label v-for="severity in severityLevels" :key="severity" class="text-sm">
                {{ severity }}<input v-model.number="severityDays[severity]" :class="input" type="number" min="0" max="3650" step="1" :placeholder="t('admin.logging.inheritRetention')" />
              </label>
            </div>
          </fieldset>
          <div class="flex flex-wrap gap-4">
            <button :class="button" :disabled="busy || !retentionLoaded" type="submit">{{ t('admin.logging.saveRetention') }}</button>
            <button :class="button" :disabled="busy" type="button" @click="loadRetention">{{ t('admin.logging.refresh') }}</button>
          </div>
        </form>
      </AdminSection>

      <AdminSection :title="t('admin.logging.quotaTitle')" :description="t('admin.logging.quotaHelp')">
        <p v-if="quotaLoaded" class="mb-3 text-sm text-flixer-muted">{{ t('admin.logging.quotaUsage', { bytes: quotaUsedBytes.toLocaleString() }) }}</p>
        <form class="flex flex-wrap items-end gap-4" @submit.prevent="saveQuota">
          <label class="text-sm">{{ t('admin.logging.quotaLimit') }}<input v-model.number="quotaMaxBytes" :class="input" type="number" min="0" max="1125899906842624" step="1" required :disabled="!quotaLoaded" /></label>
          <button :class="button" :disabled="busy || !quotaLoaded" type="submit">{{ t('admin.logging.quotaSave') }}</button>
          <button :class="button" :disabled="busy" type="button" @click="loadQuota">{{ t('admin.logging.refresh') }}</button>
        </form>
      </AdminSection>

      <AdminSection :title="t('admin.logging.ownerTitle')" :description="t('admin.logging.ownerHelp')">
        <p v-if="ownerError" role="alert" class="mb-3 text-sm text-amber-300">{{ ownerError }}</p>
        <form class="flex flex-wrap items-end gap-4" @submit.prevent="saveOwner">
          <label class="text-sm">{{ t('admin.logging.ownerToken') }}<input v-model="ownerToken" :class="input" type="password" minlength="32" maxlength="1024" required autocomplete="new-password" /></label>
          <button :class="button" :disabled="busy" type="submit">{{ t('admin.logging.connectOwner') }}</button>
          <button :class="button" :disabled="busy" type="button" @click="loadOwner">{{ t('admin.logging.refresh') }}</button>
        </form>
        <template v-if="ownerConfigured">
          <p v-if="ownerCapacity" class="mt-4 text-sm text-flixer-muted">{{ t('admin.logging.ownerCapacity', { database: ownerCapacity.database_bytes.toLocaleString(), available: ownerCapacity.filesystem_available_bytes.toLocaleString(), total: ownerCapacity.filesystem_total_bytes.toLocaleString(), debt: ownerCapacity.compaction_debt_bytes.toLocaleString(), compactions: ownerCapacity.compactions_in_progress }) }}</p>
          <p class="mt-4 text-sm text-amber-300">{{ t('admin.logging.capacityHelp') }}</p>
          <form class="mt-3 flex flex-wrap items-end gap-4" @submit.prevent="saveCapacity">
            <label class="text-sm">{{ t('admin.logging.maxDatabaseBytes') }}<input v-model.number="maxDatabaseBytes" :class="input" type="number" min="0" max="1125899906842624" step="1" required :disabled="!capacityLoaded" /></label>
            <label class="text-sm">{{ t('admin.logging.minFreeBytes') }}<input v-model.number="minFreeBytes" :class="input" type="number" min="0" max="1125899906842624" step="1" required :disabled="!capacityLoaded" /></label>
            <button :class="button" :disabled="busy || !capacityLoaded" type="submit">{{ t('admin.logging.saveCapacity') }}</button>
          </form>
          <div class="mt-6 border-t border-flixer-border pt-4">
            <h4 class="text-sm font-semibold">{{ t('admin.logging.ownerPairingsTitle') }}</h4>
            <p class="mt-2 text-sm text-flixer-muted">{{ t('admin.logging.ownerPairingsHelp') }}</p>
            <p v-if="ownerPairingsError" role="alert" class="mt-2 text-sm text-amber-300">{{ ownerPairingsError }}</p>
            <form class="mt-3 flex flex-wrap items-end gap-4" @submit.prevent="issueOwnerPairing">
              <label class="text-sm">{{ t('admin.logging.ownerPairingDeployment') }}<input v-model="ownerPairingDeployment" :class="input" maxlength="128" required :disabled="busy" /></label>
              <label class="text-sm">{{ t('admin.logging.ownerPairingMinutes') }}<input v-model.number="ownerPairingMinutes" :class="input" type="number" min="1" max="15" step="1" required :disabled="busy" /></label>
              <label class="text-sm">{{ t('admin.logging.ownerPairingDays') }}<input v-model.number="ownerPairingDays" :class="input" type="number" min="1" max="364" step="1" required :disabled="busy" /></label>
              <button :class="button" type="submit" :disabled="busy || Boolean(issuedPairing)">{{ t('admin.logging.issueOwnerPairing') }}</button>
              <button :class="button" type="button" :disabled="busy || !ownerPairingDeployment" @click="loadOwnerPairings">{{ t('admin.logging.listOwnerPairings') }}</button>
            </form>
            <div v-if="issuedPairing" class="mt-4 rounded border border-amber-500/40 p-3">
              <p class="text-sm text-amber-300">{{ t('admin.logging.ownerPairingSecretHelp', { deployment: issuedPairing.deployment, time: new Date(issuedPairing.expiresAt).toLocaleString() }) }}</p>
              <label class="mt-2 block text-sm">{{ t('admin.logging.ownerPairingSecret') }}<input :value="issuedPairing.token" :class="input" type="password" readonly autocomplete="off" /></label>
              <div class="mt-3 flex gap-3">
                <button :class="button" type="button" @click="copyOwnerPairing">{{ t('admin.logging.copyOwnerPairing') }}</button>
                <button :class="button" type="button" @click="issuedPairing = null">{{ t('admin.logging.dismissOwnerPairing') }}</button>
              </div>
            </div>
            <p v-if="ownerPairingsLoaded && !ownerPairings.length" class="mt-3 text-sm text-flixer-muted">{{ t('admin.logging.noOwnerPairings') }}</p>
            <ul v-else-if="ownerPairingsLoaded" class="mt-3 divide-y divide-flixer-border">
              <li v-for="pairing in ownerPairings" :key="pairing.id" class="flex flex-wrap items-center gap-3 py-2 text-sm">
                <code class="break-all">{{ pairing.id }}</code>
                <span class="text-flixer-muted">{{ t('admin.logging.ownerPairingExpires', { time: new Date(pairing.expiresAt).toLocaleString() }) }}</span>
                <button :class="button" type="button" :disabled="busy" @click="revokeOwnerPairing(pairing)">{{ t('admin.logging.revoke') }}</button>
              </li>
            </ul>
            <h4 class="mt-5 text-sm font-semibold">{{ t('admin.logging.ownerCredentialsTitle') }}</h4>
            <p class="mt-2 text-sm text-flixer-muted">{{ t('admin.logging.ownerCredentialsHelp') }}</p>
            <button :class="button" class="mt-3" type="button" :disabled="busy || !ownerPairingDeployment" @click="loadOwnerCredentials">{{ t('admin.logging.listOwnerCredentials') }}</button>
            <p v-if="ownerCredentialsError" role="alert" class="mt-2 text-sm text-amber-300">{{ ownerCredentialsError }}</p>
            <p v-else-if="ownerCredentialsLoaded && !ownerCredentials.length" class="mt-3 text-sm text-flixer-muted">{{ t('admin.logging.noOwnerCredentials') }}</p>
            <ul v-else-if="ownerCredentialsLoaded" class="mt-3 divide-y divide-flixer-border">
              <li v-for="credential in ownerCredentials" :key="credential.id" class="flex flex-wrap items-center gap-3 py-2 text-sm">
                <code class="break-all">{{ credential.id }}</code>
                <span class="text-flixer-muted">{{ t('admin.logging.ownerPairingExpires', { time: new Date(credential.expiresAt).toLocaleString() }) }}</span>
                <button :class="button" type="button" :disabled="busy" @click="revokeOwnerManagement(credential)">{{ t('admin.logging.revoke') }}</button>
              </li>
            </ul>
          </div>
        </template>
      </AdminSection>

      <AdminSection :title="t('admin.logging.credentialsTitle')" :description="t('admin.logging.credentialsHelp')">
        <p v-if="credentialsError" role="alert" class="text-sm text-amber-300">{{ t('admin.logging.credentialsError') }}</p>
        <p v-else-if="credentialsLoaded && !credentials.length" class="text-sm text-flixer-muted">{{ t('admin.logging.noCredentials') }}</p>
        <ul v-else class="max-h-64 divide-y divide-flixer-border overflow-auto">
          <li v-for="credential in credentials" :key="credential.id" class="flex flex-wrap items-center gap-3 py-2 text-sm">
            <strong>{{ credential.scope }}</strong><code class="break-all">{{ credential.id }}</code>
            <span v-if="credential.scope === 'ingest'" class="text-flixer-muted">{{ credential.app || t('admin.logging.unrestrictedCredential') }}</span>
            <span class="text-flixer-muted">{{ t('admin.logging.credentialExpiry', { time: new Date(credential.expiresAt).toLocaleString() }) }}</span>
            <button :class="button" type="button" :disabled="credentialsBusy" @click="revokeCredential(credential)">{{ t('admin.logging.revoke') }}</button>
          </li>
        </ul>
        <button :class="button" class="mt-3" type="button" :disabled="credentialsBusy" @click="loadCredentials">{{ t('admin.logging.refresh') }}</button>
      </AdminSection>

      <AdminSection :title="t('admin.logging.rateTitle')" :description="t('admin.logging.rateHelp')">
        <form class="flex flex-wrap items-end gap-4" @submit.prevent="saveRate">
          <label class="text-sm">{{ t('admin.logging.rate') }}<input v-model.number="rate" :class="input" type="number" min="1" max="100000" required :disabled="!rateLoaded" /></label>
          <label class="text-sm">{{ t('admin.logging.burst') }}<input v-model.number="burst" :class="input" type="number" min="1000" max="1000000" required :disabled="!rateLoaded" /></label>
          <label class="text-sm">{{ t('admin.logging.credentialRate') }}<input v-model.number="credentialRate" :class="input" type="number" min="0" max="100000" required :disabled="!rateLoaded" /></label>
          <label class="text-sm">{{ t('admin.logging.credentialBurst') }}<input v-model.number="credentialBurst" :class="input" type="number" min="0" max="1000000" required :disabled="!rateLoaded" /></label>
          <label class="text-sm">{{ t('admin.logging.serviceRate') }}<input v-model.number="serviceRate" :class="input" type="number" min="0" max="100000" required :disabled="!rateLoaded" /></label>
          <label class="text-sm">{{ t('admin.logging.serviceBurst') }}<input v-model.number="serviceBurst" :class="input" type="number" min="0" max="1000000" required :disabled="!rateLoaded" /></label>
          <button :class="button" type="submit" :disabled="busy || !rateLoaded">{{ t('admin.logging.saveRate') }}</button>
          <button :class="button" type="button" :disabled="busy" @click="loadRate">{{ t('admin.logging.refresh') }}</button>
        </form>
      </AdminSection>

      <AdminSection :title="t('admin.logging.analytics')" :description="t('admin.logging.analyticsHelp')">
        <form class="mb-4 flex flex-wrap items-end gap-3" @submit.prevent="loadStats">
          <label class="text-sm">{{ t('admin.logging.analyticsWindow') }}
            <select v-model.number="analyticsHours" :class="input" @change="changeAnalyticsWindow"><option :value="1">1h</option><option :value="24">24h</option><option :value="168">7d</option><option :value="720">30d</option></select>
          </label>
          <label class="text-sm">{{ t('admin.logging.analyticsBucket') }}
            <select v-model="analyticsBucket" :class="input">
              <option value="minute" :disabled="analyticsHours > 24">{{ t('admin.logging.bucketMinute') }}</option>
              <option value="hour">{{ t('admin.logging.bucketHour') }}</option>
              <option value="day">{{ t('admin.logging.bucketDay') }}</option>
            </select>
          </label>
          <button :class="button" type="submit">{{ t('admin.logging.applyAnalytics') }}</button>
        </form>
        <p v-if="appliedAnalytics" class="mb-2 text-sm text-flixer-muted">{{ t('admin.logging.analyticsApplied', { hours: appliedAnalytics.hours, bucket: t(analyticsBucketKeys[appliedAnalytics.bucket]) }) }}</p>
        <p v-if="analyticsStatus === 'loading'" role="status" class="text-sm text-flixer-muted">{{ t('admin.logging.statsLoading') }}</p>
        <p v-else-if="analyticsStatus === 'error'" role="alert" class="text-sm text-amber-300">{{ t('admin.logging.statsError') }}</p>
        <ul v-else-if="summary.length" class="flex flex-wrap gap-4">
          <li v-for="[name, count] in summary" :key="name" class="rounded bg-white/5 px-4 py-2"><strong>{{ name }}</strong>: {{ count }}</li>
        </ul>
        <p v-else class="text-sm text-flixer-muted">{{ t('admin.logging.noStats') }}</p>
        <div v-if="summary.length && analytics" class="mt-4 grid gap-4 lg:grid-cols-2">
          <AnalyticsTrendChart :points="analytics.events" :label="t('admin.logging.eventsTrend')" />
          <AnalyticsTrendChart :points="analytics.errors" :label="t('admin.logging.errorsTrend')" />
        </div>
        <p v-if="summary.length" class="mt-2 text-sm text-flixer-muted">{{ t('admin.logging.trendHelp') }}</p>
      </AdminSection>

      <AdminSection :title="t('admin.logging.topSources')" :description="t('admin.logging.topSourcesHelp')">
        <p v-if="sourceStatus === 'loading'" role="status" class="text-sm text-flixer-muted">{{ t('admin.logging.statsLoading') }}</p>
        <p v-else-if="sourceStatus === 'error'" role="alert" class="text-sm text-amber-300">{{ t('admin.logging.statsError') }}</p>
        <p v-else-if="sourceStatus === 'tooBroad'" role="alert" class="text-sm text-amber-300">{{ t('admin.logging.sourceTooBroad') }}</p>
        <p v-else-if="!sourceStats.length" class="text-sm text-flixer-muted">{{ t('admin.logging.noStats') }}</p>
        <ol v-else class="divide-y divide-flixer-border">
          <li v-for="sourceCount in sourceStats.slice(0, 10)" :key="JSON.stringify([sourceCount.app, sourceCount.source])" class="flex flex-wrap gap-3 py-2 text-sm">
            <strong>{{ sourceCount.count.toLocaleString() }}</strong><span>{{ sourceCount.app }}</span>
            <span class="break-words text-flixer-muted">{{ sourceCount.source || t('admin.logging.unspecifiedSource') }}</span>
          </li>
        </ol>
        <button :class="button" class="mt-3" type="button" @click="loadSources">{{ t('admin.logging.refresh') }}</button>
      </AdminSection>

      <AdminSection :title="t('admin.logging.applicationCounts')" :description="t('admin.logging.applicationCountsHelp')">
        <p v-if="sourceStatus === 'loading'" role="status" class="text-sm text-flixer-muted">{{ t('admin.logging.statsLoading') }}</p>
        <p v-else-if="sourceStatus === 'error'" role="alert" class="text-sm text-amber-300">{{ t('admin.logging.statsError') }}</p>
        <p v-else-if="sourceStatus === 'tooBroad'" role="alert" class="text-sm text-amber-300">{{ t('admin.logging.sourceTooBroad') }}</p>
        <p v-else-if="!applicationStats.length" class="text-sm text-flixer-muted">{{ t('admin.logging.noStats') }}</p>
        <ol v-else class="max-h-80 divide-y divide-flixer-border overflow-auto">
          <li v-for="item in applicationStats" :key="item.app" class="flex flex-wrap gap-3 py-2 text-sm">
            <strong>{{ item.count.toLocaleString() }}</strong><span class="break-words">{{ item.app }}</span>
          </li>
        </ol>
        <button :class="button" class="mt-3" type="button" @click="loadSources">{{ t('admin.logging.refresh') }}</button>
      </AdminSection>

      <AdminSection :title="t('admin.logging.errorGroups')" :description="t('admin.logging.errorGroupsHelp')">
        <p v-if="groupsError" role="alert" class="text-sm text-amber-300">{{ t('admin.logging.groupsError') }}</p>
        <p v-else-if="!errorGroups.length" class="text-sm text-flixer-muted">{{ t('admin.logging.noGroups') }}</p>
        <ul v-else class="max-h-80 divide-y divide-flixer-border overflow-auto">
          <li v-for="group in errorGroups" :key="group.fingerprint" class="flex flex-wrap gap-3 py-2 text-sm">
            <strong>{{ group.count }}×</strong><span>{{ group.app }}</span><span>{{ group.source }}</span>
            <span class="min-w-0 flex-1 break-words">{{ group.message }}</span>
            <span class="text-flixer-muted">{{ group.type }} {{ group.code }}</span>
          </li>
        </ul>
        <button :class="button" class="mt-3" type="button" @click="loadErrorGroups">{{ t('admin.logging.refresh') }}</button>
      </AdminSection>

      <AdminSection :title="t('admin.logging.history')" :description="t('admin.logging.searchHelp')">
        <p class="mb-3 text-sm text-flixer-muted">{{ t('admin.logging.filterPrivacy') }}</p>
        <p v-if="presetError" role="alert" class="mb-3 text-sm text-amber-300">{{ presetError }}</p>
        <div class="mb-4 flex flex-wrap items-end gap-2">
          <label class="text-sm">{{ t('admin.logging.filterName') }}<input v-model="filterName" :class="input" maxlength="80" /></label>
          <button :class="button" type="button" :disabled="!filterName.trim()" @click="saveFilter">{{ t('admin.logging.saveFilter') }}</button>
          <label class="text-sm">{{ t('admin.logging.savedFilters') }}
            <select v-model="selectedFilter" :class="input">
              <option value="">{{ t('admin.logging.selectFilter') }}</option>
              <option v-for="filter in savedFilters" :key="filter.name" :value="filter.name">{{ filter.name }}</option>
            </select>
          </label>
          <button :class="button" type="button" :disabled="!selectedFilter" @click="loadFilter">{{ t('admin.logging.loadFilter') }}</button>
          <button :class="button" type="button" :disabled="!selectedFilter" @click="removeFilter">{{ t('admin.logging.deleteFilter') }}</button>
          <button :class="button" type="button" @click="copyFilterLink">{{ t('admin.logging.copyFilterLink') }}</button>
        </div>
        <form class="grid gap-3 md:grid-cols-4" @submit.prevent="search(false)">
          <label class="text-sm">{{ t('admin.logging.text') }}<input v-model="text" :class="input" type="search" /></label>
          <label class="text-sm">{{ t('admin.logging.textMode') }}
            <select v-model="textMode" :class="input">
              <option value="all">{{ t('admin.logging.matchWords') }}</option>
              <option value="phrase">{{ t('admin.logging.matchPhrase') }}</option>
              <option value="substring">{{ t('admin.logging.matchSubstring') }}</option>
              <option value="regex">{{ t('admin.logging.matchRegex') }}</option>
            </select>
          </label>
          <label class="text-sm">{{ t('admin.logging.app') }}<input v-model="app" :class="input" /></label>
          <label class="text-sm">{{ t('admin.logging.source') }}<input v-model="source" :class="input" /></label>
          <label class="text-sm">{{ t('admin.logging.instance') }}<input v-model="instance" :class="input" /></label>
          <label class="text-sm">{{ t('admin.logging.eventCode') }}<input v-model="eventCode" :class="input" /></label>
          <label class="text-sm">{{ t('admin.logging.trace') }}<input v-model="trace" :class="input" /></label>
          <label class="text-sm">{{ t('admin.logging.requestId') }}<input v-model="requestId" :class="input" /></label>
          <label class="text-sm">{{ t('admin.logging.task') }}<input v-model="task" :class="input" /></label>
          <label class="text-sm">{{ t('admin.logging.level') }}
            <select v-model="level" :class="input">
              <option value="">{{ t('admin.logging.allLevels') }}</option>
              <option v-for="name in ['trace', 'debug', 'info', 'warn', 'error', 'fatal']" :key="name" :value="name">{{ name }}</option>
            </select>
          </label>
          <label class="text-sm">{{ t('admin.logging.window') }}
            <select v-model.number="hours" :class="input"><option :value="1">1h</option><option :value="24">24h</option><option :value="168">7d</option><option :value="720">30d</option></select>
          </label>
          <label class="text-sm">{{ t('admin.logging.timeZone') }}
            <select v-model="timeZone" :class="input"><option value="local">{{ t('admin.logging.localTime') }}</option><option value="utc">UTC</option></select>
          </label>
          <div class="flex flex-wrap items-end gap-2 md:col-span-3">
            <button :class="button" type="submit" :disabled="searching">{{ t('admin.logging.search') }}</button>
            <button :class="button" type="button" :disabled="searching" @click="loadRecent">{{ t('admin.logging.recent') }}</button>
          </div>
        </form>
        <p v-if="textMode === 'regex'" class="mt-2 text-sm text-flixer-muted">{{ t('admin.logging.regexHelp') }}</p>
        <ul class="mt-4 max-h-[36rem] divide-y divide-flixer-border overflow-auto font-mono text-xs">
          <li v-for="event in events" :key="event.event_id">
            <button type="button" class="flex w-full flex-wrap gap-2 py-2 text-left hover:bg-white/5" @click="selected = event">
              <span class="text-flixer-muted">{{ formatLogTime(event.time, timeZone) }}</span>
              <strong :class="loggingLevelClass(event.level)">{{ event.level }}</strong><span>{{ event.app }}</span><span>{{ event.instance_id }}</span><span>{{ event.source }}</span>
              <span class="min-w-0 flex-1 whitespace-pre-wrap break-words">{{ event.message }}</span>
            </button>
          </li>
          <li v-if="events.length === 0" class="py-6 text-center text-flixer-muted">{{ t('admin.logging.empty') }}</li>
        </ul>
        <button v-if="cursor" :class="button" class="mt-3" type="button" :disabled="searching" @click="search(true)">{{ t('admin.logging.more') }}</button>
        <div class="mt-3 flex flex-wrap items-center gap-3">
          <button :class="button" type="button" :disabled="!events.length" @click="exportEvents(events, 'history')">{{ t('admin.logging.export') }}</button>
          <span class="text-sm text-flixer-muted">{{ t('admin.logging.exportHelp', { limit: MAX_LOG_EXPORT_EVENTS }) }}</span>
        </div>
        <div v-if="selected" class="mt-4 rounded border border-flixer-border p-3">
          <div class="flex flex-wrap justify-between gap-2"><h3 class="font-semibold">{{ t('admin.logging.details') }}</h3><div class="flex gap-2"><button :class="button" type="button" @click="copyEvent(selected)">{{ t('admin.logging.copy') }}</button><button :class="button" type="button" @click="selected = null">{{ t('admin.logging.close') }}</button></div></div>
          <div class="mt-3 flex flex-wrap gap-2">
            <button v-if="selected.trace_id" :class="button" type="button" @click="inspectCorrelation('trace', selected.trace_id)">{{ t('admin.logging.inspectTrace') }}</button>
            <button v-if="selected.task_id" :class="button" type="button" @click="inspectCorrelation('task', selected.task_id)">{{ t('admin.logging.inspectTask') }}</button>
          </div>
          <pre class="mt-3 max-h-80 overflow-auto whitespace-pre-wrap break-all text-xs">{{ JSON.stringify(selected, null, 2) }}</pre>
        </div>
      </AdminSection>

      <div id="logger-correlation">
        <AdminSection :title="t('admin.logging.correlationTitle')" :description="t('admin.logging.correlationHelp', { limit: MAX_CORRELATION_EVENTS })">
          <form class="flex flex-wrap items-end gap-3" @submit.prevent="loadCorrelation()">
            <label class="text-sm">{{ t('admin.logging.correlationKind') }}
              <select v-model="correlationKind" :class="input"><option value="trace">{{ t('admin.logging.trace') }}</option><option value="task">{{ t('admin.logging.task') }}</option></select>
            </label>
            <label class="min-w-0 flex-1 text-sm">{{ t('admin.logging.correlationId') }}
              <input v-model="correlationId" :class="input" type="text" maxlength="1024" required />
            </label>
            <button :class="button" type="submit" :disabled="correlationBusy">{{ t('admin.logging.search') }}</button>
          </form>
          <p v-if="correlationBusy" role="status" class="mt-3 text-sm text-flixer-muted">{{ t('admin.logging.correlationLoading') }}</p>
          <p v-if="correlationError" role="alert" class="mt-3 text-sm text-amber-300">{{ t('admin.logging.correlationError') }}</p>
          <template v-if="correlationQuery">
            <p class="mt-3 break-all text-sm text-flixer-muted">{{ t('admin.logging.correlationShowing', { kind: correlationQuery.kind, id: correlationQuery.id }) }}</p>
            <button v-if="correlationCursor && correlationEvents.length < MAX_CORRELATION_EVENTS" :class="button" class="mt-3" type="button" :disabled="correlationBusy" @click="loadCorrelation(true)">{{ t('admin.logging.olderEvents') }}</button>
            <p v-else-if="correlationCursor" class="mt-3 text-sm text-amber-300">{{ t('admin.logging.correlationLimit', { limit: MAX_CORRELATION_EVENTS }) }}</p>
            <ul class="mt-4 max-h-[36rem] divide-y divide-flixer-border overflow-auto font-mono text-xs">
              <li v-for="event in correlationEvents" :key="event.event_id">
                <button type="button" class="flex w-full flex-wrap gap-2 py-2 text-left hover:bg-white/5" @click="correlationSelected = event">
                  <span class="text-flixer-muted">{{ formatLogTime(event.ingested_at, timeZone) }}</span>
                  <strong :class="loggingLevelClass(event.level)">{{ event.level }}</strong><span>{{ event.app }}</span><span>{{ event.instance_id }}</span><span>{{ event.source }}</span>
                  <span class="min-w-0 flex-1 whitespace-pre-wrap break-words">{{ event.message }}</span>
                </button>
              </li>
              <li v-if="!correlationBusy && !correlationError && !correlationEvents.length" class="py-6 text-center text-flixer-muted">{{ t('admin.logging.empty') }}</li>
            </ul>
            <div v-if="correlationSelected" class="mt-4 rounded border border-flixer-border p-3">
              <div class="flex flex-wrap justify-between gap-2"><h3 class="font-semibold">{{ t('admin.logging.details') }}</h3><div class="flex gap-2"><button :class="button" type="button" @click="copyEvent(correlationSelected)">{{ t('admin.logging.copy') }}</button><button :class="button" type="button" @click="correlationSelected = null">{{ t('admin.logging.close') }}</button></div></div>
              <pre class="mt-3 max-h-80 overflow-auto whitespace-pre-wrap break-all text-xs">{{ JSON.stringify(correlationSelected, null, 2) }}</pre>
            </div>
          </template>
        </AdminSection>
      </div>

      <AdminSection :title="t('admin.logging.liveTitle')" :description="t('admin.logging.liveFilterHelp')">
        <div class="flex flex-wrap items-center gap-3">
          <button :class="button" type="button" @click="live ? stopLive() : startLive()">{{ live ? t('admin.logging.stopLive') : t('admin.logging.startLive') }}</button>
          <button v-if="live" :class="button" type="button" @click="toggleLivePause">{{ livePaused ? t('admin.logging.resumeLive') : t('admin.logging.pauseLive') }}</button>
          <label class="flex items-center gap-2 text-sm"><input v-model="autoScroll" type="checkbox" />{{ t('admin.logging.autoScroll') }}</label>
        </div>
        <p v-if="live" role="status" class="mt-3 text-sm">{{ t(`admin.logging.${liveStatus}`) }}</p>
        <p v-if="livePaused" role="status" class="mt-2 text-sm text-flixer-muted">{{ t('admin.logging.pausedHelp', { count: bufferedWhilePaused }) }}</p>
        <p v-if="gap" role="alert" class="mt-2 text-sm text-amber-300">{{ t('admin.logging.gap') }}</p>
        <ul ref="liveList" class="mt-4 max-h-[36rem] divide-y divide-flixer-border overflow-auto font-mono text-xs">
          <li v-for="event in visibleLiveEvents" :key="event.event_id">
            <button type="button" class="flex w-full flex-wrap gap-2 py-2 text-left hover:bg-white/5" @click="liveSelected = event">
              <span class="text-flixer-muted">{{ formatLogTime(event.time, timeZone) }}</span>
              <strong :class="loggingLevelClass(event.level)">{{ event.level }}</strong><span>{{ event.app }}</span><span>{{ event.instance_id }}</span><span>{{ event.source }}</span>
              <span class="min-w-0 flex-1 whitespace-pre-wrap break-words">{{ event.message }}</span>
            </button>
          </li>
          <li v-if="visibleLiveEvents.length === 0" class="py-6 text-center text-flixer-muted">{{ t('admin.logging.empty') }}</li>
        </ul>
        <div class="mt-3 flex flex-wrap items-center gap-3">
          <button :class="button" type="button" :disabled="!visibleLiveEvents.length" @click="exportEvents(visibleLiveEvents, 'live')">{{ t('admin.logging.export') }}</button>
          <span class="text-sm text-flixer-muted">{{ t('admin.logging.exportHelp', { limit: MAX_LOG_EXPORT_EVENTS }) }}</span>
        </div>
        <div v-if="liveSelected" class="mt-4 rounded border border-flixer-border p-3">
          <div class="flex flex-wrap justify-between gap-2"><h3 class="font-semibold">{{ t('admin.logging.details') }}</h3><div class="flex gap-2"><button :class="button" type="button" @click="copyEvent(liveSelected)">{{ t('admin.logging.copy') }}</button><button :class="button" type="button" @click="liveSelected = null">{{ t('admin.logging.close') }}</button></div></div>
          <div class="mt-3 flex flex-wrap gap-2">
            <button v-if="liveSelected.trace_id" :class="button" type="button" @click="inspectCorrelation('trace', liveSelected.trace_id)">{{ t('admin.logging.inspectTrace') }}</button>
            <button v-if="liveSelected.task_id" :class="button" type="button" @click="inspectCorrelation('task', liveSelected.task_id)">{{ t('admin.logging.inspectTask') }}</button>
          </div>
          <pre class="mt-3 max-h-80 overflow-auto whitespace-pre-wrap break-all text-xs">{{ JSON.stringify(liveSelected, null, 2) }}</pre>
        </div>
      </AdminSection>
    </template>
  </div>
</template>
