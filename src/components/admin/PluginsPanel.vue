<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { addPluginRepository, disablePlugin, discoverPlugins, enablePlugin, importLocalPluginPackage, installPlugin as installPluginRequest, listPluginInstallations, listPluginRepositories, listPluginUpdateHistory, localPluginImportStatus, previewLocalPluginPackage, refreshPluginRepository, removePluginRepository, uninstallPlugin, type LocalPluginManifest, type PluginCatalogEntry, type PluginInstallation, type PluginRepository, type PluginUpdateHistoryEntry } from '../../api'
import { confirmAction } from '../../composables/confirm'
import { notify } from '../../composables/notify'
import { refreshPluginPages } from '../../composables/usePluginPages'
import { describeRequestError } from '../../composables/useProfile'
import { catchError } from '../../utils/catchError'
import AdminSection from './AdminSection.vue'
import PluginCatalogImage from './PluginCatalogImage.vue'
import { isValidPluginVersion, pluginVersionAction, sortPluginVersions } from './pluginVersions'

const { t } = useI18n()
const router = useRouter()
const installations = ref<PluginInstallation[]>([])
const installationsReady = ref(false)
const repositories = ref<PluginRepository[]>([])
const catalog = ref<PluginCatalogEntry[]>([])
const selectedVersions = ref<Record<string, string>>({})
const updateHistory = ref<Record<string, PluginUpdateHistoryEntry[]>>({})
const historyOpen = ref<string[]>([])
const historyLoading = ref<string | null>(null)
const name = ref('')
const url = ref('')
const query = ref('')
const target = ref('')
const capability = ref('')
const isLoading = ref(false)
const catalogLoading = ref(false)
const isSaving = ref(false)
const refreshing = ref<string | null>(null)
const installing = ref<string | null>(null)
const updating = ref<string | null>(null)
const uninstalling = ref<string | null>(null)
const loadError = ref('')
const localImportEnabled = ref(false)
const localPackage = ref<File | null>(null)
const localManifest = ref<LocalPluginManifest | null>(null)
const localApprovedPermissions = ref<string[]>([])
const localPreviewing = ref(false)
const localImporting = ref(false)

const inputClass = 'w-full rounded border border-flixer-border bg-flixer-background px-3 py-2 text-sm outline-none focus:border-flixer-accent'
const versionSelectClass = 'max-w-full rounded border border-flixer-border bg-flixer-background px-3 py-2 text-sm outline-none focus:border-flixer-accent disabled:opacity-60'
const buttonClass = 'rounded bg-flixer-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-flixer-primary/80 disabled:opacity-60'
const quietButtonClass = 'rounded border border-flixer-border px-3 py-2 text-sm font-semibold transition hover:bg-white/5 disabled:opacity-60'

async function loadCatalog() {
  const request = ++catalogRequest
  catalogLoading.value = true
  const [error, result] = await catchError(discoverPlugins({ q: query.value || undefined, target: target.value || undefined, capability: capability.value || undefined }))
  if (request !== catalogRequest) return
  catalogLoading.value = false
  if (error) loadError.value = describeRequestError(error)
  else catalog.value = result.map((plugin) => ({ ...plugin, versions: sortPluginVersions(plugin.versions) }))
}
let catalogRequest = 0

function catalogKey(plugin: PluginCatalogEntry) {
  return `${plugin.repository?.id ?? ''}:${plugin.id}`
}

function selectedVersion(plugin: PluginCatalogEntry): string {
  const selected = selectedVersions.value[catalogKey(plugin)]
  return plugin.versions.some((release) => release.version === selected) ? selected! : plugin.versions[0]?.version ?? ''
}

function selectVersion(plugin: PluginCatalogEntry, event: Event) {
  selectedVersions.value[catalogKey(plugin)] = (event.target as HTMLSelectElement).value
}

function installedPlugin(plugin: PluginCatalogEntry) {
  return installations.value.find((installed) => installed.id === plugin.id)
}

function catalogAction(plugin: PluginCatalogEntry) {
  return pluginVersionAction(selectedVersion(plugin), installedPlugin(plugin)?.version)
}

function catalogActionLabel(plugin: PluginCatalogEntry) {
  const action = catalogAction(plugin)
  return t(`admin.plugins.${action === 'switch' ? 'changeVersion' : action}`)
}

async function load() {
  isLoading.value = true
  installationsReady.value = false
  loadError.value = ''
  // The catalogue comes from remote repositories and can be slow; it must not hold back the local lists.
  const catalogLoad = loadCatalog()
  const [featureError, featureEnabled] = await catchError(localPluginImportStatus())
  localImportEnabled.value = !featureError && featureEnabled
  try {
    const [error, result] = await catchError(Promise.all([listPluginInstallations(), listPluginRepositories()]))
    if (error) {
      loadError.value = describeRequestError(error)
    } else {
      ;[installations.value, repositories.value] = result
      installationsReady.value = true
    }
  } finally {
    isLoading.value = false
  }
  await catalogLoad
}

function selectLocalPackage(event: Event) {
  const input = event.currentTarget as HTMLInputElement
  localPackage.value = input.files?.[0] ?? null
  localManifest.value = null
  localApprovedPermissions.value = []
}

async function previewLocalPackage() {
  if (!localPackage.value) return
  localPreviewing.value = true
  localManifest.value = null
  localApprovedPermissions.value = []
  try {
    const [error, manifest] = await catchError(previewLocalPluginPackage(localPackage.value))
    if (error) notify.error(describeRequestError(error))
    else localManifest.value = manifest
  } finally {
    localPreviewing.value = false
  }
}

async function importLocalPackage() {
  if (!localPackage.value || !localManifest.value) return
  const importedName = localManifest.value.name
  const permissions = localManifest.value.permissions
  if (permissions.some((permission) => !localApprovedPermissions.value.includes(permission))) return
  if (!(await confirmAction(t('admin.plugins.confirmLocalImport', {
    name: localManifest.value.name,
    version: localManifest.value.version,
    permissions: permissions.length ? permissions.join(', ') : t('admin.plugins.noPermissions'),
  })))) return

  localImporting.value = true
  try {
    const [error] = await catchError(importLocalPluginPackage(localPackage.value, localApprovedPermissions.value))
    if (error) notify.error(describeRequestError(error))
    else {
      localPackage.value = null
      localManifest.value = null
      localApprovedPermissions.value = []
      await load()
      void refreshPluginPages()
      notify.success(t('admin.plugins.localImportSuccess', { name: importedName }))
    }
  } finally {
    localImporting.value = false
  }
}

async function refreshRepository(repository: PluginRepository) {
  refreshing.value = repository.id
  try {
    const [error] = await catchError(refreshPluginRepository(repository.id))
    if (error) notify.error(describeRequestError(error))
  } finally {
    refreshing.value = null
    await load()
  }
}

async function install(plugin: PluginCatalogEntry, version: string) {
  const repositoryId = plugin.repository?.id
  if (!repositoryId) return
  const existing = installedPlugin(plugin)
  if (existing?.enabled) {
    notify.error(t('admin.plugins.disableBeforeUpdate'))
    return
  }
  const permissions = plugin.permissions ?? []
  if (existing) {
    const newPermissions = permissions.filter((permission) => !existing.approvedPermissions.includes(permission))
    const action = pluginVersionAction(version, existing.version)
    if (!(await confirmAction(t(action === 'downgrade' ? 'admin.plugins.confirmDowngrade' : 'admin.plugins.confirmUpdate', {
      name: plugin.name,
      version,
      permissions: newPermissions.length ? newPermissions.join(', ') : t('admin.plugins.noNewPermissions'),
    })))) return
  } else if (permissions.length && !(await confirmAction(
    t('admin.plugins.confirmInstall', {
      name: plugin.name,
      version,
      permissions: permissions.join(', '),
    }),
  ))) return

  installing.value = `${plugin.id}:${version}`
  try {
    const [error] = await catchError(installPluginRequest(plugin.id, { repositoryId, version, approvedPermissions: permissions }))
    if (error) {
      notify.error(describeRequestError(error))
    } else {
      await load()
      void refreshPluginPages()
      notify.success(existing ? t('admin.plugins.versionChangedSuccess', { name: plugin.name, version }) : t('admin.plugins.installedSuccess', { name: plugin.name }))
    }
  } finally {
    installing.value = null
  }
}

async function updateInstalled(plugin: PluginInstallation) {
  const update = plugin.availableUpdate
  if (!update || !plugin.repository) return
  if (plugin.enabled) {
    notify.error(t('admin.plugins.disableBeforeUpdate'))
    return
  }
  const newlyRequested = update.permissions.filter((permission) => !plugin.approvedPermissions.includes(permission))
  if (
    !(await confirmAction(
      t('admin.plugins.confirmUpdate', {
        name: plugin.manifest.name,
        version: update.version,
        permissions: newlyRequested.length ? newlyRequested.join(', ') : t('admin.plugins.noNewPermissions'),
      }),
    ))
  )
    return

  updating.value = plugin.id
  try {
    const [error] = await catchError(installPluginRequest(plugin.id, {
      repositoryId: plugin.repository.id,
      version: update.version,
      approvedPermissions: [...new Set([...plugin.approvedPermissions, ...update.permissions])],
    }))
    if (error) {
      notify.error(describeRequestError(error))
    } else {
      await load()
      void refreshPluginPages()
      notify.success(t('admin.plugins.updatedSuccess', { name: plugin.manifest.name }))
    }
  } finally {
    updating.value = null
  }
}

async function setEnabled(plugin: PluginInstallation, enabled: boolean) {
  if (!enabled && !(await confirmAction(t('admin.plugins.confirmDisable', { name: plugin.manifest.name })))) return
  const [error] = await catchError(enabled ? enablePlugin(plugin.id) : disablePlugin(plugin.id))
  if (error) {
    notify.error(describeRequestError(error))
  } else {
    await load()
    void refreshPluginPages()
  }
}

async function uninstall(plugin: PluginInstallation) {
  if (uninstalling.value) return
  if (!(await confirmAction(t('admin.plugins.confirmUninstall', { name: plugin.manifest.name }), { danger: true }))) return
  uninstalling.value = plugin.id
  try {
    const [error] = await catchError(uninstallPlugin(plugin.id))
    if (error) {
      notify.error(describeRequestError(error))
    } else {
      await load()
      void refreshPluginPages()
    }
  } finally {
    uninstalling.value = null
  }
}

function uninstallCatalog(plugin: PluginCatalogEntry) {
  const installed = installedPlugin(plugin)
  if (installed) void uninstall(installed)
}

async function toggleHistory(plugin: PluginInstallation) {
  if (historyOpen.value.includes(plugin.id)) {
    historyOpen.value = historyOpen.value.filter((id) => id !== plugin.id)
    return
  }
  historyOpen.value = [...historyOpen.value, plugin.id]
  historyLoading.value = plugin.id
  try {
    const [error, history] = await catchError(listPluginUpdateHistory(plugin.id))
    if (error) {
      notify.error(describeRequestError(error))
      historyOpen.value = historyOpen.value.filter((id) => id !== plugin.id)
    } else {
      updateHistory.value[plugin.id] = history
    }
  } finally {
    historyLoading.value = null
  }
}

function openSettings(plugin: PluginInstallation) {
  void router.push({ query: { tab: 'plugins', plugin: plugin.id } })
}

async function addRepository() {
  isSaving.value = true
  try {
    const [error] = await catchError(addPluginRepository(name.value, url.value))
    if (error) {
      notify.error(describeRequestError(error))
    } else {
      name.value = ''
      url.value = ''
      await load()
      notify.success(t('admin.plugins.repositoryAdded'))
    }
  } finally {
    isSaving.value = false
  }
}

async function removeRepository(repository: PluginRepository) {
  if (repository.isOfficial) return
  if (!(await confirmAction(t('admin.plugins.confirmRemove', { name: repository.name }), { danger: true }))) return

  const [error] = await catchError(removePluginRepository(repository.id))
  if (error) {
    notify.error(describeRequestError(error))
  } else {
    await load()
  }
}

onMounted(load)
</script>

<template>
  <div class="flex flex-col gap-6">
    <AdminSection :title="t('admin.plugins.installed')" :description="t('admin.plugins.installedDescription')">
      <div v-if="loadError" class="flex flex-wrap items-center justify-between gap-3 text-sm text-red-300" role="alert">
        <span>{{ loadError }}</span>
        <button :class="quietButtonClass" type="button" @click="load">{{ t('admin.plugins.retry') }}</button>
      </div>
      <p v-else-if="isLoading && installations.length === 0" class="text-sm text-flixer-muted" role="status">
        {{ t('admin.plugins.loading') }}
      </p>
      <p v-else-if="installations.length === 0" class="text-sm text-flixer-muted">
        {{ t('admin.plugins.noInstalled') }}
      </p>
      <ul v-else class="divide-y divide-flixer-border" aria-label="Installed plugins">
        <li v-for="plugin in installations" :key="plugin.id"
          class="flex flex-wrap items-start justify-between gap-3 py-4 first:pt-0 last:pb-0">
          <div class="min-w-0">
            <div class="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <h3 class="font-semibold">{{ plugin.manifest.name }}</h3>
              <span class="text-xs text-flixer-muted">{{ plugin.id }} · {{ plugin.version }}</span>
            </div>
            <p class="mt-1 text-sm text-flixer-muted">{{ plugin.manifest.description }}</p>
            <p class="mt-1 text-xs text-flixer-muted">
              {{ t('admin.plugins.byAuthor', { author: plugin.manifest.author }) }}
              <span class="mx-1">·</span>
              {{ Object.keys(plugin.manifest.targets).join(', ') }}
              <span v-if="plugin.repository" class="mx-1">·</span>
              {{ plugin.repository?.name }}
            </p>
            <p v-if="plugin.activationReason" class="mt-2 text-xs text-flixer-muted">{{ plugin.activationReason }}</p>
            <p v-if="Object.keys(plugin.targetStatus).length"
              class="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-flixer-muted">
              <span v-for="(state, target) in plugin.targetStatus" :key="target">{{ t('admin.plugins.targetState', {
                target, state
              }) }}</span>
            </p>
            <p v-if="plugin.lastError" class="mt-2 text-sm text-red-300" role="status">{{ plugin.lastError }}</p>
          </div>
          <div class="flex shrink-0 flex-wrap items-center gap-2">
            <span class="rounded border border-flixer-border px-2 py-1 text-xs capitalize"
              :data-status="plugin.status">{{ plugin.status }}</span>
            <button v-if="plugin.activationSupported && !plugin.enabled" :class="quietButtonClass" type="button"
              @click="setEnabled(plugin, true)">
              {{ t('admin.plugins.enable') }}
            </button>
            <button v-if="plugin.enabled" :class="quietButtonClass" type="button" @click="setEnabled(plugin, false)">
              {{ t('admin.plugins.disable') }}
            </button>
            <button v-if="plugin.availableUpdate" :class="quietButtonClass" type="button"
              :disabled="updating === plugin.id || plugin.enabled" @click="updateInstalled(plugin)">
              {{ updating === plugin.id ? t('admin.plugins.updating') : `${t('admin.plugins.update')}
              ${plugin.availableUpdate.version}` }}
            </button>
            <button v-if="plugin.manifest.settingsSchema" :class="quietButtonClass" type="button"
              @click="openSettings(plugin)">
              {{ t('admin.plugins.settings') }}
            </button>
            <button :class="quietButtonClass" type="button" :aria-expanded="historyOpen.includes(plugin.id)"
              @click="toggleHistory(plugin)">
              {{ historyLoading === plugin.id ? t('admin.plugins.historyLoading') : t('admin.plugins.history') }}
            </button>
            <button v-if="!plugin.enabled" :class="quietButtonClass" type="button"
              :disabled="uninstalling === plugin.id" @click="uninstall(plugin)">
              {{ t('admin.plugins.uninstall') }}
            </button>
          </div>
          <ol v-if="historyOpen.includes(plugin.id)" class="mt-4 w-full border-t border-flixer-border pt-3 text-sm">
            <li v-if="!updateHistory[plugin.id]?.length" class="text-flixer-muted">{{ t('admin.plugins.noHistory') }}
            </li>
            <li v-for="entry in updateHistory[plugin.id]" :key="entry.id" class="py-2 first:pt-0">
              <div class="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <span class="font-medium capitalize">{{ entry.action }} {{ entry.outcome }}</span>
                <span class="text-flixer-muted"> {{ entry.fromVersion ? `${entry.fromVersion} → ` : '' }}{{
                  entry.toVersion }} </span>
                <time class="text-xs text-flixer-muted" :datetime="entry.createdAt">{{ new
                  Date(entry.createdAt).toLocaleString() }}</time>
              </div>
              <p v-if="entry.errorMessage" class="mt-1 text-sm text-red-300">{{ entry.errorMessage }}</p>
            </li>
          </ol>
        </li>
      </ul>
    </AdminSection>

    <AdminSection v-if="localImportEnabled" :title="t('admin.plugins.localImport')"
      :description="t('admin.plugins.localImportDescription')">
      <form class="grid gap-3 sm:grid-cols-[minmax(16rem,1fr)_auto] sm:items-end" @submit.prevent="previewLocalPackage">
        <label class="grid gap-1 text-sm">
          <span>{{ t('admin.plugins.packageFile') }}</span>
          <input :class="inputClass" type="file" accept=".tar.gz,.tgz,application/gzip" required
            @change="selectLocalPackage" />
        </label>
        <button :class="buttonClass" type="submit" :disabled="localPreviewing || !localPackage">
          {{ localPreviewing ? t('admin.plugins.inspectingPackage') : t('admin.plugins.inspectPackage') }}
        </button>
      </form>

      <div v-if="localManifest" class="mt-5 border-t border-flixer-border pt-4">
        <h3 class="font-semibold">{{ localManifest.name }} <span class="text-xs font-normal text-flixer-muted">{{
          localManifest.id }} · {{ localManifest.version }}</span></h3>
        <p class="mt-1 text-sm text-flixer-muted">{{ localManifest.description }}</p>
        <p class="mt-1 text-xs text-flixer-muted">{{ localManifest.capabilities.join(', ') }} · {{
          Object.keys(localManifest.targets).join(', ') }}</p>
        <fieldset v-if="localManifest.permissions.length" class="mt-4 grid gap-2">
          <legend class="mb-2 text-sm font-semibold">{{ t('admin.plugins.requestedPermissions') }}</legend>
          <label v-for="permission in localManifest.permissions" :key="permission"
            class="flex items-start gap-2 text-sm">
            <input v-model="localApprovedPermissions" type="checkbox" :value="permission"
              class="mt-1 accent-flixer-primary" />
            <span class="break-all">{{ permission }}</span>
          </label>
        </fieldset>
        <p v-else class="mt-4 text-sm text-flixer-muted">{{ t('admin.plugins.noPermissions') }}</p>
        <button :class="buttonClass" type="button" class="mt-4"
          :disabled="localImporting || localManifest.permissions.some((permission) => !localApprovedPermissions.includes(permission))"
          @click="importLocalPackage">
          {{ localImporting ? t('admin.plugins.importingPackage') : t('admin.plugins.importPackage') }}
        </button>
      </div>
    </AdminSection>

    <AdminSection :title="t('admin.plugins.repositories')" :description="t('admin.plugins.repositoriesDescription')">
      <form class="grid gap-3 sm:grid-cols-[minmax(10rem,0.7fr)_minmax(16rem,1.3fr)_auto] sm:items-end"
        @submit.prevent="addRepository">
        <label class="grid gap-1 text-sm">
          <span>{{ t('admin.plugins.repositoryName') }}</span>
          <input v-model="name" :class="inputClass" maxlength="120" required autocomplete="off" />
        </label>
        <label class="grid gap-1 text-sm">
          <span>{{ t('admin.plugins.repositoryUrl') }}</span>
          <input v-model="url" :class="inputClass" type="url" maxlength="2048"
            placeholder="https://example.org/plugins/repository.json" required autocomplete="url" />
        </label>
        <button :class="buttonClass" type="submit" :disabled="isSaving || !name.trim() || !url.trim()">
          {{ isSaving ? t('admin.plugins.saving') : t('admin.plugins.addRepository') }}
        </button>
      </form>

      <p v-if="isLoading && repositories.length === 0" class="mt-5 text-sm text-flixer-muted" role="status">
        {{ t('admin.plugins.loading') }}
      </p>
      <p v-else-if="repositories.length === 0" class="mt-5 text-sm text-flixer-muted">
        {{ t('admin.plugins.noRepositories') }}
      </p>
      <ul v-else class="mt-5 divide-y divide-flixer-border" :aria-label="t('admin.plugins.repositories')">
        <li v-for="repository in repositories" :key="repository.id"
          class="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <h3 class="font-medium">{{ repository.name }}</h3>
              <span v-if="repository.isOfficial"
                class="rounded border border-flixer-accent px-2 py-0.5 text-xs text-flixer-accent">
                {{ t('admin.plugins.official') }}
              </span>
            </div>
            <p class="mt-1 break-all text-xs text-flixer-muted">{{ repository.url }}</p>
            <p v-if="repository.lastError" class="mt-1 text-sm text-red-300" role="status">{{ repository.lastError }}
            </p>
          </div>
          <div class="flex shrink-0 gap-2">
            <button :class="quietButtonClass" type="button" :disabled="refreshing === repository.id"
              @click="refreshRepository(repository)">
              {{ refreshing === repository.id ? t('admin.plugins.refreshing') : t('admin.plugins.refresh') }}
            </button>
            <button v-if="!repository.isOfficial" :class="quietButtonClass" type="button"
              @click="removeRepository(repository)">
              {{ t('admin.plugins.removeRepository') }}
            </button>
          </div>
        </li>
      </ul>
    </AdminSection>

    <AdminSection :title="t('admin.plugins.discover')" :description="t('admin.plugins.discoverDescription')">
      <form class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:items-end" @submit.prevent="load">
        <label class="grid gap-1 text-sm">
          <span>{{ t('admin.plugins.search') }}</span>
          <input v-model="query" :class="inputClass" type="search" maxlength="100" autocomplete="off" />
        </label>
        <label class="grid gap-1 text-sm">
          <span>{{ t('admin.plugins.target') }}</span>
          <select v-model="target" :class="inputClass">
            <option value="">{{ t('admin.plugins.allTargets') }}</option>
            <option value="flixer">Flixer</option>
            <option value="flixer-indexer">Indexer</option>
            <option value="flixer-streamer">Streamer</option>
            <option value="flixer-web">Web</option>
          </select>
        </label>
        <label class="grid gap-1 text-sm">
          <span>{{ t('admin.plugins.capability') }}</span>
          <input v-model="capability" :class="inputClass" maxlength="100" autocomplete="off" />
        </label>
        <button :class="quietButtonClass" type="submit" :disabled="catalogLoading">{{ t('admin.plugins.search')
        }}</button>
      </form>
      <p v-if="catalog.length === 0" class="mt-5 text-sm text-flixer-muted">
        {{ catalogLoading ? t('admin.plugins.loading') : t('admin.plugins.noAvailable') }}
      </p>
      <ul v-else class="mt-5 divide-y divide-flixer-border" :aria-label="t('admin.plugins.discover')">
        <li v-for="plugin in catalog" :key="`${plugin.repository?.id}:${plugin.id}`" class="py-4 first:pt-0 last:pb-0">
          <PluginCatalogImage v-if="plugin.banner && plugin.repository?.id" :repository-id="plugin.repository.id"
            :path="plugin.banner" kind="banner" class="mb-3 h-24 w-full rounded" />
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div class="flex min-w-0 gap-3">
              <PluginCatalogImage v-if="plugin.icon && plugin.repository?.id" :repository-id="plugin.repository.id"
                :path="plugin.icon" kind="icon" class="h-12 w-12 shrink-0 rounded" />
              <div class="min-w-0">
                <div class="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <h3 class="font-semibold">{{ plugin.name }}</h3>
                  <span class="text-xs text-flixer-muted">{{ plugin.id }}</span>
                </div>
                <p class="mt-1 text-sm text-flixer-muted">{{ plugin.description }}</p>
                <p class="mt-1 text-xs text-flixer-muted">
                  {{ t('admin.plugins.byAuthor', { author: plugin.author }) }}
                  <span class="mx-1">·</span>{{ plugin.repository?.name }} <span class="mx-1">·</span>{{
                    plugin.targets.join(', ') }}
                </p>
                <p v-if="plugin.capabilities?.length" class="mt-1 text-xs text-flixer-muted">{{
                  plugin.capabilities.join(', ') }}</p>
              </div>
            </div>
            <div class="flex shrink-0 flex-wrap items-center gap-2">
              <template v-if="installationsReady">
                <select :value="selectedVersion(plugin)"
                  :aria-label="t('admin.plugins.versionFor', { name: plugin.name })" :class="versionSelectClass"
                  :disabled="Boolean(installing) || updating === plugin.id || uninstalling === plugin.id"
                  @change="selectVersion(plugin, $event)">
                  <option v-for="release in plugin.versions" :key="release.version" :value="release.version"
                    :disabled="!isValidPluginVersion(release.version)">{{
                      release.version }}</option>
                </select>
                <button :class="quietButtonClass" type="button"
                  :disabled="Boolean(installing) || updating === plugin.id || uninstalling === plugin.id || Boolean(installedPlugin(plugin)?.enabled) || !isValidPluginVersion(selectedVersion(plugin))"
                  :title="installedPlugin(plugin)?.enabled ? t(catalogAction(plugin) === 'uninstall' ? 'admin.plugins.disableBeforeUninstall' : 'admin.plugins.disableBeforeUpdate') : undefined"
                  @click="catalogAction(plugin) === 'uninstall' ? uninstallCatalog(plugin) : install(plugin, selectedVersion(plugin))">
                  {{ installing === `${plugin.id}:${selectedVersion(plugin)}` ? t(installedPlugin(plugin) ?
                    'admin.plugins.updating' : 'admin.plugins.installing') :
                  catalogActionLabel(plugin) }}
                </button>
              </template>
              <span v-else-if="isLoading" class="text-xs text-flixer-muted" role="status">{{ t('admin.plugins.loading')
                }}</span>
            </div>
          </div>
        </li>
      </ul>
    </AdminSection>
  </div>
</template>
